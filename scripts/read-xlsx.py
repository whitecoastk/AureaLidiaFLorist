"""Lectura local de XLSX sin instalar paquetes. No ejecuta fórmulas ni macros."""
import sys, json, zipfile, posixpath, xml.etree.ElementTree as ET
N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
R='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
def read_xlsx(filename):
    if not filename.lower().endswith('.xlsx'): raise ValueError('Selecciona un archivo .xlsx, sin macros.')
    with zipfile.ZipFile(filename) as z:
        if len(z.infolist())>5000 or sum(x.file_size for x in z.infolist())>50000000: raise ValueError('Excel demasiado grande.')
        def xml(name):
            b=z.read(name)
            if len(b)>15000000 or b'<!DOCTYPE' in b or b'<!ENTITY' in b: raise ValueError('Contenido XML no permitido.')
            return ET.fromstring(b)
        book=xml('xl/workbook.xml'); rels=xml('xl/_rels/workbook.xml.rels')
        sheet=next((s for s in book.findall('s:sheets/s:sheet',N) if s.attrib.get('name')=='Productos'),None)
        if sheet is None: raise ValueError('Falta la hoja Productos.')
        target=next(x.attrib['Target'] for x in rels if x.attrib['Id']==sheet.attrib[R])
        name=posixpath.normpath(target.lstrip('/') if target.startswith('/') else 'xl/'+target)
        if not name.startswith('xl/'): raise ValueError('Ruta de hoja no permitida.')
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(t.text or '' for t in si.iter('{'+N['s']+'}t')) for si in xml('xl/sharedStrings.xml')]
        rows=[]; cells=0
        for row in xml(name).findall('s:sheetData/s:row',N):
            if len(rows)>10000: raise ValueError('Máximo 10,000 filas.')
            values=[]
            for cell in row.findall('s:c',N):
                cells+=1
                if cells>200000: raise ValueError('Demasiadas celdas.')
                if cell.find('s:f',N) is not None: raise ValueError('Usa valores, no fórmulas, en Productos: '+cell.attrib.get('r',''))
                col=0
                for char in cell.attrib['r']:
                    if char.isalpha(): col=col*26+ord(char.upper())-64
                    else: break
                if col>30: continue
                while len(values)<col: values.append(None)
                t=cell.attrib.get('t'); v=cell.find('s:v',N)
                if t=='inlineStr': value=''.join(x.text or '' for x in cell.findall('.//s:t',N))
                elif t=='s': value=strings[int(v.text)] if v is not None else ''
                elif t=='b': value=v is not None and v.text=='1'
                elif t=='e': raise ValueError('Celda con error: '+cell.attrib['r'])
                elif v is None: value=None
                elif t=='str': value=v.text or ''
                else:
                    value=float(v.text)
                    if value.is_integer(): value=int(value)
                values[col-1]=value
            rows.append(values)
        return rows
if __name__=='__main__':
    try: print(json.dumps(read_xlsx(sys.argv[1]),ensure_ascii=False))
    except Exception as e: print(str(e),file=sys.stderr);sys.exit(1)

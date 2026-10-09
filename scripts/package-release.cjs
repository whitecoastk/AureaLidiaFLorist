const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const check=spawnSync(process.execPath,[path.join(__dirname,'check-release.cjs')],{cwd:root,stdio:'inherit'});
if(check.status!==0)process.exit(check.status||1);
const name=process.argv[2]||'release';
if(!/^release(?:-[a-zA-Z0-9-]+)?$/.test(name))throw Error('Usa release o release-nombre como destino dentro del proyecto.');
const dest=path.join(root,name);
if(fs.existsSync(dest))throw Error('El destino ya existe. Usa un nombre nuevo; no se reemplazan ni borran archivos.');
const files=JSON.parse(fs.readFileSync(path.join(root,'deploy-manifest.json'),'utf8'));
for(const file of files){const source=path.resolve(root,file);if(!source.startsWith(root+path.sep)||!fs.existsSync(source))throw Error('Archivo inválido: '+file);}
for(const file of files){const target=path.join(dest,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
console.log('Entrega local preparada: '+dest+'. No se ha publicado.');

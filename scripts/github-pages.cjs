const fs=require('node:fs'),path=require('node:path');
function writePagesConfig(root){
  const publicFiles=new Set(JSON.parse(fs.readFileSync(path.join(root,'deploy-manifest.json'),'utf8')));
  const excluded=new Set(['scripts','tests','docs','domain','node_modules','artifacts','release','release-*','.git','.env','.env.*']);
  function visit(dir=''){
    for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
      const file=dir?dir+'/'+entry.name:entry.name;
      if(entry.isDirectory()){
        if(entry.name.startsWith('.')||excluded.has(file)||/^release(?:-|$)/.test(file))continue;
        visit(file);
      }else if(!publicFiles.has(file)&&file!=='_config.yml')excluded.add(file);
    }
  }
  visit();
  const yaml='# Generado por scripts/build.cjs. GitHub Pages usa Jekyll para excluir fuentes administrativas.\n# No agregar .nojekyll: impediría aplicar estas exclusiones.\nurl: '+JSON.stringify(require(path.join(root,'site.config.json')).url)+'\nbaseurl: ""\nexclude:\n'+[...excluded].sort().map(file=>'  - '+JSON.stringify(file)).join('\n')+'\n';
  fs.writeFileSync(path.join(root,'_config.yml'),yaml);
}
module.exports={writePagesConfig};

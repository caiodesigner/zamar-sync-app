const assert=require('node:assert/strict');const {join}=require('node:path');const {readFileSync}=require('node:fs');
module.exports=async({app,page,directory})=>{
 const song={id:'export-test',title:'Música de teste',author:'',archived:false,sections:[{id:'v',label:'Verso',text:'[C]Minha [G]canção'}],sequence:['v'],music:{originalKey:'C',targetKey:'D',accidentals:'sharp',mode:'lyrics'}};
 await page.evaluate(song=>window.zamar.saveSong(song),song);
 await page.getByRole('button',{name:'Configurações',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Exportar biblioteca completa',exact:true}).count(),0);
 for(const [label,kind,text] of [['Exportar letras de músicas','lyrics','Minha canção'],['Exportar cifras de músicas','chords','[C]Minha [G]canção']]){
  const file=join(directory,kind+'.json');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file);
  await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').getByRole('status').filter({hasText:`1 músicas exportadas em: ${file}`}).waitFor();
  const catalog=JSON.parse(readFileSync(file,'utf8'));assert.equal(catalog.exportKind,kind);assert.equal(catalog.songs[0].sections[0].text,text);assert.equal(catalog.files,undefined);
 }
 assert.equal((await page.evaluate(()=>window.zamar.listSongs())).songs[0].sections[0].text,song.sections[0].text);
 console.log('PASS: separate JSON lyric/chord export buttons, readable catalogs, and unchanged local song.');return {app,page};
};

const {test}=require('node:test');const assert=require('node:assert/strict');
const {DEFAULT_THEME,validateTheme,slideGeometry,contentRecord,readContent}=require('../dist/shared/content');
const {slidesForText}=require('../dist/shared/slides');const {chordPages,DEFAULT_MUSIC,parseChords}=require('../dist/shared/chords');
test('themes accept only one or two columns and old themes default to one',()=>{
 const {columns,...old}=DEFAULT_THEME;assert.equal(validateTheme(old).columns,1);
 for(const columns of [1,2])assert.equal(readContent('theme',contentRecord('theme',{...DEFAULT_THEME,columns})).columns,columns);
 for(const columns of [0,3,-1,1.5,'2',null])assert.throws(()=>validateTheme({...DEFAULT_THEME,columns}));
});
test('two columns paginate within each column width and preserve all text in reading order',()=>{
 const text=Array.from({length:40},(_,i)=>`Linha ${i+1}`).join('\n');
 for(const ratio of ['16:9','4:3'])for(const font of ['mono','sans']){
  const theme={...DEFAULT_THEME,ratio,font,columns:2};const pages=slidesForText(text,theme);assert.equal(pages.join('\n'),text);assert(pages.every(p=>p.split('\n').length<=16));assert(pages.length<slidesForText(text,{...theme,columns:1}).length);
  const geometry=slideGeometry(theme);assert.equal(geometry.columnWidth*2+geometry.columnGap,geometry.innerWidth);
 }
 const words='Palavra '.repeat(200);assert.equal(slidesForText(words,{...DEFAULT_THEME,columns:2}).join('').replace(/\s/g,''),words.replace(/\s/g,''));
});
test('two-column chord pagination preserves lyrics, tokens and transposition across ratios and font sizes',()=>{
 const text=Array.from({length:24},(_,i)=>`[C]Linha ${i+1} [G/B]🎵`).join('\n');
 for(const ratio of ['16:9','4:3'])for(const fontSize of [32,56,96]){
  const theme={...DEFAULT_THEME,ratio,fontSize,columns:2};const geometry=slideGeometry(theme);const pages=chordPages(text,{...DEFAULT_MUSIC,targetKey:'D'},theme);
  assert(pages.every(p=>p.lines.length<=Math.max(1,Math.floor(geometry.innerHeight/(fontSize*2.6)))*2));
  assert.equal(pages.flatMap(p=>p.lines).map(l=>l.lyric).join(''),parseChords(text).lines.map(l=>l.lyric).join(''));
  assert.deepEqual(pages.flatMap(p=>p.lines.flatMap(l=>l.anchors.map(a=>a.token))),Array.from({length:24},()=>['D','A/C#']).flat());
 }
});

test('column preference belongs to each song and survives records and program snapshots independently',()=>{
 const {validateSong,songRecord,readSong}=require('../dist/shared/songs');
 const song={id:'a',title:'A',author:'',archived:false,sections:[{id:'v',label:'Verso',text:'Linha'}],sequence:['v'],columns:2};
 const other={...song,id:'b',title:'B',columns:1};assert.equal(readSong(songRecord(song)).columns,2);assert.equal(readSong(songRecord(other)).columns,1);
 const {columns,...old}=song;assert.equal(validateSong(old).columns??1,1);
 for(const columns of [0,3,'2',null])assert.throws(()=>validateSong({...song,columns}));
 const program={id:'program',title:'Culto',items:[{id:'item-a',title:'A',text:'Linha',source:{kind:'song',id:'a'},theme:DEFAULT_THEME,songSnapshot:song},{id:'item-b',title:'B',text:'Linha',source:{kind:'song',id:'b'},theme:DEFAULT_THEME,songSnapshot:other}]};
 const saved=readContent('program',contentRecord('program',program));assert.deepEqual(saved.items.map(i=>i.songSnapshot.columns),[2,1]);assert.equal(DEFAULT_THEME.columns,1);
});

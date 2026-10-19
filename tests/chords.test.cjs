const {test}=require('node:test');const assert=require('node:assert/strict');
const {DEFAULT_MUSIC,transpose,parseChords,chordPages,validateChordPage,chordUnits,chordRuns}=require('../dist/shared/chords');
const {DEFAULT_THEME,contentRecord,readContent}=require('../dist/shared/content');
const {songRecord,readSong}=require('../dist/shared/songs');
const {initialPresentation}=require('../dist/main/protocol');
test('transpose qualified chords and inverted bass, preserve unknown tokens',()=>{
 const m={...DEFAULT_MUSIC,targetKey:'D'};
 for(const [input,expected] of [['C','D'],['Am7','Bm7'],['G/B','A/C#'],['Bbmaj7','Cmaj7'],['F#dim7','G#dim7'],['C7(b9)/E','D7(b9)/F#']])assert.equal(transpose(input,m).token,expected);
 assert.equal(transpose('C',{...m,targetKey:'Db',accidentals:'flat'}).token,'Db');
 assert.equal(transpose('C'+'1'.repeat(78)+'x',m).known,false);
 assert.deepEqual(transpose('H7',m),{token:'H7',known:false});assert.equal(transpose('Cmagic',m).token,'Cmagic');
});
test('markup retains lyric, anchors, duplicate anchors, Unicode and warnings',()=>{
 const p=parseChords('[C][G/B]Olá 🌍[H7]! [Dm]');assert.equal(p.lines[0].lyric,'Olá 🌍! ');assert.deepEqual(p.lines[0].anchors.map(a=>a.position),[0,0,6,8]);assert.equal(p.warnings.length,1);assert.equal(chordRuns(parseChords('[C]Minha [G/B]canção').lines[0])[0].lyric,'Minha ');
 assert.doesNotThrow(()=>validateChordPage({lines:parseChords('a[C]\u0301').lines}));
 assert.equal(parseChords('Literal [sem fechar').lines[0].lyric,'Literal [sem fechar');
});
test('layout preserves all lyric and chord tokens across themes and transposition',()=>{
 const text='[C]Olá 🌍 [G/B]canção '.repeat(80);const parsed=parseChords(text).lines[0];
 for(const ratio of ['16:9','4:3'])for(const font of ['mono','sans'])for(const fontSize of [32,96]){
  const theme={...DEFAULT_THEME,ratio,font,fontSize,margin:15};const pages=chordPages(text,{...DEFAULT_MUSIC,targetKey:'D'},theme);assert.ok(pages.length>1);
  assert.equal(pages.flatMap(p=>p.lines).map(l=>l.lyric).join(''),parsed.lyric);
  assert.equal(pages.flatMap(p=>p.lines).flatMap(l=>l.anchors).length,160);
  for(const page of pages){assert.deepEqual(validateChordPage(page),page);for(const l of page.lines)assert.ok(chordUnits(l).length);}
 }
 assert.throws(()=>validateChordPage({lines:[{lyric:'🌍',anchors:[{position:1,token:'C'}]}]}),/Posição/);
});
test('song, program and closed checkpoint preserve original music snapshot',()=>{
 const song={id:'music',title:'Teste',author:'',archived:false,sections:[{id:'verse',label:'Verso',text:'[C]Uma [G/B]canção'}],sequence:['verse'],music:{...DEFAULT_MUSIC,targetKey:'D',mode:'chords'}};
 const record=songRecord(song);assert.equal(record.data.notation[0].lines[0].anchors[1].position,4);assert.deepEqual(readSong(record),song);
 const p={id:'program',title:'Culto',items:[{id:'item',title:song.title,text:song.sections[0].text,source:{kind:'song',id:song.id},theme:DEFAULT_THEME,songSnapshot:song}]};
 const copy=readContent('program',contentRecord('program',p));song.music.targetKey='F';assert.equal(copy.items[0].songSnapshot.music.targetKey,'D');
 const chords=chordPages(p.items[0].text,{...DEFAULT_MUSIC,targetKey:'D'},DEFAULT_THEME)[0];const checkpoint=initialPresentation(JSON.stringify({text:'Uma canção',theme:DEFAULT_THEME,chords,revision:9}));assert.deepEqual(checkpoint.chords,chords);assert.equal(checkpoint.black,true);assert.equal(checkpoint.outputOpen,false);
});

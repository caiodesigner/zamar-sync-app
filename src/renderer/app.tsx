import { ImportContent } from './import-content';
import { useAutosave } from './use-autosave';
import type { AutoEntry, SaveReceipt } from '../shared/autosave';
import { chordPages, parseChords, DEFAULT_MUSIC } from '../shared/chords';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Bridge, Monitor, Snapshot } from '../shared/contracts';
import './style.css';
import { SongEditor, MusicSettings, newSong } from './song-editor';
import { Slide } from './slide';
import { searchSong, normalizeSongSearch, songSearchText, validateSong, type Song } from '../shared/songs';
import { BiblePanel } from './bible-panel';
import { BibleImport } from './bible-import';
import { passageText,passageSlides,validatePassage,BOOK_NAMES,type Passage } from '../shared/bible';
import { ThemeEditor } from './theme-editor';
import { ProgramPanel } from './program-panel';
import { DEFAULT_THEME, validateProgram, validateTextContent, validateTheme, type Catalog, type Program, type ProgramItem, type TextContent, type Theme } from '../shared/content';
import { slidesForText } from '../shared/slides';
declare global { interface Window { zamar: Bridge } }
const projection = new URLSearchParams(location.search).get('role') === 'output';
const exampleSong = {title:'Uma nova canção',text:'Vamos juntos cantar\nUma nova canção\n\nNossa voz vai ecoar\nNeste lugar'};
function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event=>{event.preventDefault();close();}}><div className="section-heading"><h2 id="dialog-title">{title}</h2><button onClick={close} aria-label="Fechar janela">Fechar</button></div>{children}</dialog>;
}
function App() {
  const [interfaceTheme,setInterfaceTheme] = useState<'dark'|'light'>('dark');
  const [changingInterfaceTheme,setChangingInterfaceTheme] = useState(false);
  useEffect(() => { if (!projection) document.documentElement.dataset.theme = interfaceTheme; }, [interfaceTheme]);
  async function toggleInterfaceTheme() {
    const next = interfaceTheme === 'dark' ? 'light' : 'dark';
    setChangingInterfaceTheme(true);
    try { await window.zamar.setInterfaceTheme(next); setInterfaceTheme(next); }
    catch (error) { setMessage(String(error)); }
    finally { setChangingInterfaceTheme(false); }
  }

  const [autoEpoch,setAutoEpoch]=useState<string|null>(null);
  const [recovery,setRecovery]=useState<SaveReceipt|null>(null);
  const [queueSong,setQueueSong]=useState<Song|null>(null);
  const [passage,setPassage]=useState<Passage|null>(null);
  const [bibleRevision,setBibleRevision]=useState(0);
  const [catalog,setCatalog] = useState<Catalog>({texts:[],themes:[],programs:[],lastProgram:null,skipped:0});
  const [program,setProgram] = useState<Program>(()=>({id:crypto.randomUUID(),title:'Nova programação',items:[]}));
  const [savedProgram,setSavedProgram] = useState('');
  const [selectedItem,setSelectedItem] = useState<string|null>(null);
  const [textId,setTextId] = useState<string|null>(null);
  const [savedText,setSavedText] = useState('');
  const [theme,setTheme] = useState<Theme>(DEFAULT_THEME);
  const [themeDraft,setThemeDraft] = useState<Theme|null>(null);
  const [savedTheme,setSavedTheme] = useState('');

  const [songs,setSongs] = useState<Song[]>([]);
  const [song,setSong] = useState<Song|null>(null);
  const [savedSong,setSavedSong] = useState('');
  const [showArchived,setShowArchived] = useState(false);
  const [songLimit,setSongLimit]=useState(100);
  const [skipped,setSkipped] = useState(0);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState('');
  const [title, setTitle] = useState('Meu rascunho');
  const [state, setState] = useState<Snapshot>({ revision: -1, text: '', theme:DEFAULT_THEME, hidden: false, black: true, outputOpen: false, mode: 'closed', status: 'Carregando' });
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [monitor, setMonitor] = useState('rehearsal');
  const [presenterView, setPresenterView] = useState(false);
  const [path, setPath] = useState('');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [tab, setTab] = useState('Músicas');
  const [query, setQuery] = useState('');
  const [slide, setSlide] = useState(0);
  const songIndex=useMemo(()=>songs.map(song=>({song,text:songSearchText(song)})),[songs]);
  const filteredSongs=useMemo(()=>{const needle=normalizeSongSearch(query.trim());return songIndex.filter(entry=>entry.song.archived===showArchived&&entry.text.includes(needle)).map(entry=>entry.song);},[songIndex,query,showArchived]);
  useEffect(()=>setSongLimit(100),[query,showArchived]);

  const [modal, setModal] = useState<'help' | 'settings' | 'bible' | 'theme' | 'import' | 'recovery' | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const songText = useMemo(()=>song ? song.sequence.map(id => song.sections.find(s=>s.id===id)?.text ?? '').join('\n\n') : draft,[song,draft]);
  const musicalSong=song??(selectedItem?queueSong:null);
  const musicalText=musicalSong?musicalSong.sequence.map(id=>musicalSong.sections.find(s=>s.id===id)?.text??'').join('\n\n'):songText;
  const music=musicalSong?.music??DEFAULT_MUSIC;
  const chordBlocks=useMemo(()=>musicalSong&&music.mode==='chords'?chordPages(musicalText,music,theme):undefined,[musicalText,music,theme,musicalSong]);
  const blocks = useMemo(()=>chordBlocks?chordBlocks.map(p=>p.lines.map(l=>l.lyric||l.anchors.map(a=>a.token).join(' ')).join('\n')):passage?passageSlides(passage,theme):slidesForText(musicalSong?parseChords(musicalText).lines.map(l=>l.lyric).join('\n'):songText,theme),[songText,theme,passage,chordBlocks,musicalText,musicalSong]);
  const contentTitle = song?.title || title;
  const libraryTheme = theme.id==='default'?DEFAULT_THEME:catalog.themes.find(t=>t.id===theme.id);
  const themeValue = JSON.stringify(libraryTheme)===JSON.stringify(theme)?theme.id:`snapshot:${theme.id}`;
  const activeSlide = Math.min(slide, Math.max(0, blocks.length - 1));
  const prepared = blocks[activeSlide] ?? '';
  const contentDirty = passage ? false : song ? JSON.stringify(song)!==savedSong : textId ? JSON.stringify({id:textId,title,text:draft})!==savedText : draft!==saved;
  const programDirty = savedProgram ? JSON.stringify(program)!==savedProgram : program.items.length>0 || program.title!=='Nova programação';
  const themeDirty = themeDraft!==null && JSON.stringify(themeDraft)!==savedTheme;
  const dirty = contentDirty || programDirty || themeDirty;
  const autoEntries:AutoEntry[]=[];
  if(contentDirty&&!selectedItem&&!passage){if(song)autoEntries.push({kind:'song',value:song,base:savedSong||null});else if(textId)autoEntries.push({kind:'text',value:{id:textId,title,text:draft},base:savedText||null});else autoEntries.push({kind:'draft',value:draft,base:JSON.stringify(saved)});}
  if(programDirty)autoEntries.push({kind:'program',value:program,base:catalog.programs.some(p=>p.id===program.id)?savedProgram:null});
  if(themeDirty&&themeDraft)autoEntries.push({kind:'theme',value:themeDraft,base:catalog.themes.some(t=>t.id===themeDraft.id)?savedTheme:null});
  const automatic=useAutosave(autoEntries,autoEpoch,!ready||maintenance||modal==='import'||modal==='recovery',(receipt,requested)=>{
    setRecovery(receipt);
    for(const entry of receipt.entries){const original=requested.find(e=>e.kind===entry.kind)!;if(entry.kind==='song'){const value=entry.value as Song;setSong(current=>JSON.stringify(current)===JSON.stringify(original.value)?value:current);if(song?.id===value.id)setSavedSong(JSON.stringify(value));}else if(entry.kind==='draft')setSaved(entry.value as string);else if(entry.kind==='text'){const value=entry.value as TextContent;if(textId===value.id){setSavedText(JSON.stringify(value));setTitle(current=>current===(original.value as TextContent).title?value.title:current);}}else if(entry.kind==='program'){const value=entry.value as Program;setProgram(current=>JSON.stringify(current)===JSON.stringify(original.value)?value:current);if(program.id===value.id)setSavedProgram(JSON.stringify(value));}else {const value=entry.value as Theme;if(themeDraft?.id===value.id){setThemeDraft(current=>JSON.stringify(current)===JSON.stringify(original.value)?value:current);setSavedTheme(JSON.stringify(value));}}}
    void Promise.all([refreshSongs(),refreshCatalog()]).catch(e=>setMessage(String(e)));
  },()=>{void Promise.all([refreshSongs(),refreshCatalog()]).catch(e=>setMessage(String(e)));});
  async function refreshRecovery(){const result=await window.zamar.recovery();setAutoEpoch(result.epoch);setRecovery(result.receipt);}
  async function recoverEntry(entry:AutoEntry){if(entry.kind==='song')selectSong(entry.value as Song);else if(entry.kind==='text')selectText(entry.value as TextContent);else if(entry.kind==='draft'){if(!canReplace())return;setPassage(null);setSong(null);setSelectedItem(null);setTextId(null);setTitle('Meu rascunho');setDraft(entry.value as string);setSaved(entry.value as string);}else if(entry.kind==='program'){if(programDirty&&!window.confirm('Substituir a programação em edição?'))return;const value=entry.value as Program;setProgram(value);setSavedProgram(JSON.stringify(value));setSelectedItem(null);await window.zamar.selectProgram(value.id);}else{const value=entry.value as Theme;setThemeDraft(value);setSavedTheme(JSON.stringify(value));setModal('theme');return;}setModal(null);setSlide(0);setMessage('Última versão confirmada preparada. A saída permanece preservada.');}
  function preparePassage(value:Passage) {if(!canReplace())return;const p=validatePassage(value);setPassage(p);setSong(null);setTextId(null);setSelectedItem(null);setTitle(`${BOOK_NAMES[p.verses[0].book-1]} ${p.verses[0].chapter}:${p.verses[0].verse} · ${p.abbreviation}`);setDraft(passageText(p));setSaved(passageText(p));setSlide(0);setMessage('Passagem preparada. Confira e use Apresentar; saída preservada.');}
  async function refreshCatalog() { const result=await window.zamar.catalog();setCatalog(result);return result; }
  async function reloadProgram() {const result=await refreshCatalog();const p=result.programs.find(p=>p.id===result.lastProgram);if(p){setProgram(p);setSavedProgram(JSON.stringify(p));}else{const p={id:crypto.randomUUID(),title:'Nova programação',items:[]};setProgram(p);setSavedProgram(JSON.stringify(p));}setSelectedItem(null);}
  async function saveProgram() {const original=JSON.stringify(program);const value=validateProgram(program);const result=await window.zamar.saveContent('program',value) as Program;setProgram(current=>JSON.stringify(current)===original?result:current);setSavedProgram(JSON.stringify(result));await refreshCatalog();}
  function newProgram() {if(programDirty && !window.confirm('Descartar alterações não salvas na programação?'))return;const p={id:crypto.randomUUID(),title:'Nova programação',items:[]};setProgram(p);setSavedProgram(JSON.stringify(p));setSelectedItem(null);}
  async function openProgram(id:string) {if(programDirty && !window.confirm('Descartar alterações não salvas na programação?'))return false;const p=catalog.programs.find(p=>p.id===id);if(!p)throw new Error('Programação não encontrada.');await window.zamar.selectProgram(id);setProgram(structuredClone(p));setSavedProgram(JSON.stringify(p));setSelectedItem(null);}
  function createText() {if(!canReplace())return;setPassage(null);setSong(null);setSelectedItem(null);setTextId(crypto.randomUUID());setTitle('Novo texto');setDraft('');setSavedText('');setSlide(0);}
  function selectText(value:TextContent) {if(!canReplace())return;setPassage(null);setSong(null);setSelectedItem(null);setTextId(value.id);setTitle(value.title);setDraft(value.text);setSavedText(JSON.stringify(value));setSlide(0);}
  async function saveText() {if(!textId){const value=draft;await window.zamar.save(value);setSaved(value);return;}const value=validateTextContent({id:textId,title,text:draft});const result=await window.zamar.saveContent('text',value) as TextContent;setTitle(current=>current===title?result.title:current);setSavedText(JSON.stringify(result));await refreshCatalog();}
  async function openDraft() {if(!canReplace())return;const data=await window.zamar.initial();setPassage(null);setSong(null);setSelectedItem(null);setTextId(null);setTitle('Meu rascunho');setDraft(data.draft);setSaved(data.draft);setSlide(0);}
  function addItem() {const item:ProgramItem={id:crypto.randomUUID(),title:contentTitle,text:musicalText,...(musicalSong?{songSnapshot:structuredClone(musicalSong)}:{}),...(passage?{scripture:structuredClone(passage)}:{}),source:passage?{kind:'bible',id:passage.versionId}:song && songs.some(s=>s.id===song.id)?{kind:'song',id:song.id}:textId && catalog.texts.some(t=>t.id===textId)?{kind:'text',id:textId}:null,theme:structuredClone(theme)};const next=validateProgram({...program,items:[...program.items,item]});setProgram(next);setMessage('Cópia adicionada. Salve a programação para preservá-la.');}
  function loadItem(item:ProgramItem) {if(!canReplace())return;setQueueSong(item.songSnapshot?structuredClone(item.songSnapshot):null);setPassage(item.scripture??null);setSong(null);setTextId(null);setSelectedItem(item.id);setTitle(item.title);setDraft(item.text);setSaved(item.text);setTheme(structuredClone(item.theme));setSlide(0);setMessage('Cópia da programação preparada; saída preservada.');}
  async function refreshItem(item:ProgramItem) {if(!item.source)return false;if(!window.confirm('Atualizar esta cópia com a versão salva na biblioteca? A saída ativa será preservada.'))return false;let title:string,text:string;let scripture:Passage|undefined;let songSnapshot:Song|undefined;if(item.source.kind==='bible'){if(!item.scripture)throw new Error('Referência da cópia indisponível.');const first=item.scripture.verses[0],last=item.scripture.verses[item.scripture.verses.length-1];scripture=await window.zamar.biblePassage(item.source.id,`${BOOK_NAMES[first.book-1]} ${first.chapter}:${first.verse}-${last.verse}`);text=passageText(scripture);title=item.title;}else if(item.source.kind==='song'){const result=await window.zamar.listSongs();setSongs(result.songs);const source=result.songs.find(s=>s.id===item.source!.id);if(!source)throw new Error('Música de origem indisponível; cópia preservada.');songSnapshot=structuredClone(source);title=source.title;text=source.sequence.map(id=>source.sections.find(s=>s.id===id)?.text??'').join('\n\n');}else{const result=await refreshCatalog();const source=result.texts.find(t=>t.id===item.source!.id);if(!source)throw new Error('Texto de origem indisponível; cópia preservada.');title=source.title;text=source.text;}const updated={...item,title,text,...(songSnapshot?{songSnapshot}:{}),...(scripture?{scripture}:{})};const next=validateProgram({...program,items:program.items.map(i=>i.id===item.id?updated:i)});setProgram(next);if(selectedItem===item.id){if(songSnapshot)setQueueSong(songSnapshot);if(scripture)setPassage(scripture);setTitle(title);setDraft(text);setSaved(text);setSlide(0);}setMessage('Cópia atualizada. Salve a programação.');}
  function openTheme(edit:boolean) {setMessage('');const value=edit && theme.id!=='default'?structuredClone(theme):{...structuredClone(theme),id:crypto.randomUUID(),title:'Novo tema'};setThemeDraft(value);setSavedTheme(JSON.stringify(value));setModal('theme');}
  function closeModal() {if(themeDirty && !window.confirm('Descartar alterações não salvas no tema?'))return;setThemeDraft(null);setModal(null);}
  async function saveTheme() {const value=validateTheme(themeDraft);const result=await window.zamar.saveContent('theme',value) as Theme;setTheme(result);setThemeDraft(null);setModal(null);await refreshCatalog();}
  async function importImage() {const image=await window.zamar.importImage();if(image)setThemeDraft(current=>current?{...current,image}:null);}

  async function refreshSongs() { const result = await window.zamar.listSongs(); setSongs(result.songs); setSkipped(result.skipped); }
  function canReplace() { return !contentDirty || window.confirm('Substituir o conteúdo com alterações não salvas?'); }
  function selectSong(value:Song) { if(!canReplace())return; setPassage(null);setSelectedItem(null);setTextId(null);setSong(structuredClone(value));setSavedSong(JSON.stringify(value));setSlide(0);setMessage('Música preparada. A saída ao vivo foi preservada.'); }
  function createSong() { if(!canReplace())return;setPassage(null);setSelectedItem(null);setTextId(null);setSong(newSong());setSavedSong('');setSlide(0); }
  async function saveSong() { const original = JSON.stringify(song); const value = validateSong(song); const result = await window.zamar.saveSong(value); setSong(current=>JSON.stringify(current)===original ? result : current);setSavedSong(JSON.stringify(result)); await refreshSongs(); }
  function navigate(offset:number) { const index = Math.max(0,Math.min(activeSlide+offset,blocks.length-1)); setSlide(index); if(presenterView && state.outputOpen && blocks[index]) void run(()=>window.zamar.present({text:blocks[index],theme,chords:chordBlocks?.[index]}),'Slide apresentado'); }
  const update = (next: Snapshot) => setState(previous => next.revision >= previous.revision ? next : previous);
  useEffect(() => {
    if(!projection) void Promise.all([refreshSongs(),reloadProgram(),refreshRecovery()]).catch(error=>setMessage(String(error)));
    const unsubscribe = window.zamar.onState(next => {
      update(next);
      if (!projection) window.zamar.initial().then(data => { setMonitors(data.monitors); setMonitor(current => current === 'rehearsal' || data.monitors.some(d => String(d.id) === current && d.availableForProjection) ? current : 'rehearsal'); }).catch(error => setMessage(String(error)));
    });
    window.zamar.initial().then(data => { setInterfaceTheme(data.interfaceTheme); setDraft(data.draft); setSaved(data.draft); setPath(data.dataPath); setMonitors(data.monitors); setMonitor(String(data.monitors.find(d => d.availableForProjection)?.id ?? 'rehearsal')); update(data.snapshot); setReady(true); }).catch(error => setMessage(String(error)));
    return unsubscribe;
  }, []);
  useEffect(() => { setPresenterView(state.outputOpen); }, [state.outputOpen]);
  useEffect(() => {
    if (projection || !dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  async function run(action: () => Promise<unknown>, success: string) { try { const result=await action(); setMessage(result===false?'Operação cancelada.':success); } catch (error) { setMessage(String(error)); } }
  async function exportSongs(kind:'lyrics'|'chords') {
    setMaintenance(true);setMaintenanceMessage('Escolha onde salvar o catálogo JSON…');
    try{const result=await window.zamar.exportSongs(kind);setMaintenanceMessage(result?`${result.count} músicas exportadas em: ${result.path}`:'Exportação cancelada.');}
    catch(error){setMaintenanceMessage(String(error));}
    finally{setMaintenance(false);}
  }
  async function backupAction(restore: boolean) {
    setMaintenance(true); setMaintenanceMessage(restore ? 'Selecione o backup a restaurar…' : 'Escolha onde salvar o backup…');
    try {
      if (restore) {
        const result = await window.zamar.restoreBackup();
        if (result) { await refreshRecovery();setDraft(result.draft); setSaved(result.draft); setTitle('Meu rascunho'); setPassage(null);setBibleRevision(n=>n+1);setSong(null); setSavedSong(''); await refreshSongs(); await reloadProgram(); setTextId(null); setTheme(DEFAULT_THEME); setSlide(0); const data = await window.zamar.initial(); update(data.snapshot); setMaintenanceMessage(`Dados restaurados. Cópia anterior preservada em: ${result.previousBackup}`); setMessage('Restauração concluída'); }
        else setMaintenanceMessage('Restauração cancelada.');
      } else {
        const result = await window.zamar.createBackup();
        setMaintenanceMessage(result ? `Backup criado em: ${result}` : 'Backup cancelado.');
      }
    } catch (error) { setMaintenanceMessage(String(error)); setMessage(String(error)); }
    finally { setMaintenance(false); }
  }
  function present() { if (ready && state.outputOpen && prepared.trim()) void run(() => window.zamar.present({text:prepared,theme,chords:chordBlocks?.[activeSlide]}), state.mode === 'rehearsal' ? 'Bloco apresentado no ensaio local' : 'Bloco enviado à projeção'); }
  useEffect(() => {
    if (projection) return;
    const handle = (event: KeyboardEvent) => {
      if (modal || event.defaultPrevented) return;
      const input = event.target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable);
      if (event.key === 'Escape' && state.outputOpen) { event.preventDefault(); void run(() => window.zamar.closeOutput(), 'Apresentação encerrada'); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault();setPresenterView(false);requestAnimationFrame(()=>search.current?.focus()); }
      else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); present(); }
      else if (!input && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key.toLowerCase() === 'o' && state.outputOpen) { event.preventDefault(); void run(()=>window.zamar.hideText(),'Visibilidade do texto atualizada'); }
        if (event.key.toLowerCase() === 'b' && state.outputOpen) { event.preventDefault(); void run(() => window.zamar.black(), 'Estado da saída atualizado'); }
        if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
      }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  });
  if (projection) return <main className="projection">{!state.black && <Slide text={state.hidden?'':state.text} theme={state.theme} chords={state.hidden?undefined:state.chords}/>}</main>;
  return <main className={`operator ${presenterView && state.outputOpen ? 'presenting' : ''}`}>
    <header className="app-header"><a className="brand" href="#main-content" aria-label="Zamar Sync — ir ao conteúdo"><span className="brand-mark">Z</span><span>ZAMAR<span className="brand-light">SYNC</span></span></a><div className="header-caption"><h1>Sua mensagem em destaque.</h1><span>Espaço de apresentação</span></div><div className="header-actions"><span className="badge">● Offline</span><button className="quiet" disabled={!ready || changingInterfaceTheme} onClick={() => void toggleInterfaceTheme()} aria-label={interfaceTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>{interfaceTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}</button><button className="quiet" onClick={() => setModal('help')}>Guia rápido</button><button className="quiet" onClick={() => setModal('settings')}>Configurações</button></div></header>
    <section className="output-bar" aria-label="Controle da saída"><span className={`status-dot ${state.outputOpen ? 'connected' : ''}`}/><label htmlFor="monitor">Destino da apresentação</label><select id="monitor" disabled={state.outputOpen} value={monitor} onChange={e => setMonitor(e.target.value)}><option value="rehearsal">Ensaio neste monitor · sem projeção externa</option>{monitors.filter(d => d.availableForProjection).map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select><button disabled={!ready || state.outputOpen} onClick={() => run(async () => { const opened = await window.zamar.openOutput(monitor === 'rehearsal' ? null : Number(monitor)); if (!opened) throw new Error('Uma apresentação já está aberta. Encerre antes de mudar o destino.'); }, monitor === 'rehearsal' ? 'Ensaio iniciado; controles disponíveis' : 'Apresentação iniciada no datashow')}>Iniciar apresentação</button><button className="quiet" disabled={!state.outputOpen} onClick={() => run(() => window.zamar.closeOutput(), 'Apresentação encerrada')}>Encerrar apresentação</button>{state.outputOpen && <button className="quiet" onClick={() => setPresenterView(value => !value)}>{presenterView ? 'Editar conteúdo' : 'Modo apresentador'}</button>}<span className="output-label">{state.mode === 'rehearsal' ? 'Ensaio local' : state.mode === 'external' ? 'Datashow ativo' : 'Apresentação encerrada'}</span></section>
    <div className="presentation-notice" aria-live="polite">{state.status}<span> Seus controles ficam neste monitor; a projeção em tela cheia usa somente uma tela separada.</span>{(state.mode === 'rehearsal' || !monitors.some(d => d.availableForProjection)) && <span> Para mostrar apenas o conteúdo no datashow, conecte-o e selecione Estender nas configurações de telas (Windows: Win+P → Estender). No modo Duplicar, as duas telas mostram a mesma imagem.</span>}</div>
    <div className="session-notice"><span className="prototype-tag">Biblioteca offline</span><span>Edições válidas são salvas automaticamente após uma pausa. Programações guardam cópias independentes. Confira o indicador antes de fechar.</span></div>
    <section className="autosave-bar" aria-label="Salvamento automático"><span role="status" aria-label="Estado do salvamento automático">{automatic.status}</span>{automatic.status.startsWith('Falha')&&<button onClick={automatic.retry}>Tentar salvar novamente</button>}<button onClick={()=>{setModal('import');}}>Importar texto ou cifra</button>{recovery&&<button onClick={()=>void run(async()=>{await refreshRecovery();setModal('recovery');},'Recuperação disponível')}>Recuperar última edição</button>}</section>
    <div className="workspace" id="main-content" tabIndex={-1}>
      <aside className="library panel" aria-label="Biblioteca"><div className="section-heading"><h2>Biblioteca</h2><button className="icon-button" onClick={() => tab === 'Músicas' ? createSong() : createText()} aria-label={tab === 'Músicas' ? 'Nova música' : 'Novo texto'} disabled={!ready || tab==='Bíblia'}>＋</button></div><label className="search-box"><span aria-hidden="true">⌕</span><input ref={search} aria-label="Buscar na biblioteca" placeholder="Buscar conteúdo…" value={query} onChange={e => setQuery(e.target.value)}/><kbd>Ctrl F</kbd></label><div className="tabs" role="tablist" aria-label="Tipo de conteúdo" onKeyDown={event => { const names = ['Músicas','Bíblia','Textos']; const index = names.indexOf(tab); const next = event.key === 'ArrowRight' ? (index+1)%3 : event.key === 'ArrowLeft' ? (index+2)%3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1; if (next < 0) return; event.preventDefault(); setTab(names[next]); setQuery(''); document.getElementById(`tab-${names[next]}`)?.focus(); }}>{['Músicas','Bíblia','Textos'].map(name => <button key={name} role="tab" aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} id={`tab-${name}`} aria-controls="library-results" onClick={() => { setTab(name); setQuery(''); }}>{name}</button>)}</div><div id="library-results" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === 'Músicas' ? <><div className="editor-actions"><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Ver arquivadas</label></div><p className="list-caption">MÚSICAS SALVAS · {filteredSongs.length}</p><div className="library-list">{filteredSongs.slice(0,songLimit).map(s=><button key={s.id} className={`library-item ${s.id===song?.id ? 'selected' : ''}`} onClick={()=>selectSong(s)}><span>♪</span><span><strong>{s.title}</strong><small>{s.author || 'Sem autor informado'}</small></span></button>)}</div>{filteredSongs.length>songLimit&&<><p className="hint">Mostrando {Math.min(songLimit,filteredSongs.length)} de {filteredSongs.length} músicas. Refine a busca ou carregue mais resultados.</p><button onClick={()=>setSongLimit(n=>n+100)}>Mostrar mais músicas</button></>}{!filteredSongs.length && <div className="empty-state"><h3>Nenhum resultado</h3><p>Cadastre uma música ou altere a busca.</p></div>}<button onClick={()=>{if(!canReplace())return;const example=newSong();example.title=exampleSong.title;example.sections[0].text=exampleSong.text;setPassage(null);setSong(example);setTextId(null);setSelectedItem(null);setSavedSong('');setSlide(0);}}>Carregar exemplo de música</button>{skipped>0 && <p role="status">{skipped} registro(s) de música de formato anterior preservado(s) no backup; cadastro manual necessário.</p>}</> : tab === 'Bíblia' ? <BiblePanel revision={bibleRevision} prepare={preparePassage} importBible={()=>setModal('bible')}/> : <><button onClick={()=>void run(openDraft,'Rascunho preparado')}>Abrir rascunho</button><p className="list-caption">TEXTOS SALVOS</p><div className="library-list">{catalog.texts.filter(t=>searchSong({id:t.id,title:t.title,author:'',archived:false,sections:[{id:'text',label:'Texto',text:t.text}],sequence:['text']},query)).map(t=><button className="library-item" key={t.id} onClick={()=>selectText(t)}><span>T</span><span><strong>{t.title}</strong><small>Texto salvo</small></span></button>)}</div>{!catalog.texts.length && <p>Use + para cadastrar um texto livre.</p>}</>}

      </div><div className="library-note">{catalog.skipped>0 && <p>{catalog.skipped} cadastro(s) de formato anterior preservado(s) no backup, sem edição nesta versão.</p>}<strong>Feito para o momento ao vivo.</strong><p>Escolha, confira e só então apresente.</p></div></aside>
      <section className="preparation" aria-label="Preparação"><div className="panel editor">{passage && !selectedItem ? <><h2>{title}</h2><p>Trecho bíblico preparado com referência, versão e atribuição em cada slide. Escolher outro conteúdo não altera a saída.</p><p>{passage.name}</p></> : selectedItem ? <><h2>{title}</h2><p>Você está preparando uma cópia da programação. Editar a biblioteca não modifica esta cópia. Use Atualizar no item para buscar a versão salva na origem.</p>{queueSong && <><MusicSettings music={queueSong.music??DEFAULT_MUSIC} change={music=>{const updated={...queueSong,music};setQueueSong(updated);setProgram(current=>({...current,items:current.items.map(i=>i.id===selectedItem?{...i,songSnapshot:structuredClone(updated)}:i)}));setSlide(0);}}/><p className="hint">Ajustes válidos desta cópia são salvos automaticamente. Salvar programação confirma imediatamente. A música da biblioteca e a saída ativa são preservadas.</p></>}<button onClick={()=>{if(!canReplace())return;setPassage(null);setSelectedItem(null);setQueueSong(null);setTextId(crypto.randomUUID());setSavedText('');}}>Criar texto a partir desta cópia</button></> : song ? <SongEditor song={song} change={setSong} dirty={contentDirty} save={()=>void run(saveSong,'Música salva no computador')}/> : <><div className="section-heading"><div><span className="eyebrow">PREPARAR CONTEÚDO</span><h2>{title}</h2></div><span className="save-state">{contentDirty ? '● Não salvo' : '✓ Texto salvo'}</span></div><label className="field">Título do texto<input aria-label="Título do texto" disabled={!textId} maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="editor-label" htmlFor="draft">Texto para apresentação <span>Uma linha em branco separa os blocos.</span></label><textarea id="draft" disabled={!ready} value={draft} onChange={e => {setDraft(e.target.value);setMessage('Alterações ainda não salvas');}} maxLength={100000} spellCheck lang="pt-BR"/><div className="editor-actions"><span className="muted">{blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'} · {draft.length.toLocaleString('pt-BR')} caracteres</span><button disabled={!ready} onClick={()=>void run(saveText,'Salvo no computador')}>Salvar texto</button></div></>}</div>
      <section className="panel preview-panel"><div className="theme-picker"><label>Tema da preparação<select aria-label="Tema da preparação" value={themeValue} onChange={e=>{setTheme(structuredClone(catalog.themes.find(t=>t.id===e.target.value)??DEFAULT_THEME));setSlide(0);}}><option value="default">Padrão</option>{themeValue.startsWith('snapshot:') && <option value={themeValue} disabled>{theme.title} · cópia preservada</option>}{catalog.themes.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><button onClick={()=>openTheme(false)}>Novo tema</button><button onClick={()=>openTheme(true)}>Editar tema</button>{selectedItem && <button onClick={()=>void run(async()=>{setProgram(validateProgram({...program,items:program.items.map(i=>i.id===selectedItem?{...i,theme:structuredClone(theme)}:i)}));},'Tema aplicado à cópia; salve a programação')}>Aplicar tema ao item</button>}</div><div className="section-heading"><div><span className="eyebrow">PRÉVIA</span><h2>{presenterView && state.outputOpen ? 'Próximo conteúdo' : 'Confira antes de apresentar'}</h2></div><span className="counter">{blocks.length ? activeSlide + 1 : 0} / {blocks.length}</span></div><div className="preview prepared" style={{aspectRatio:theme.ratio==='4:3'?'4 / 3':'16 / 9'}} aria-label="Prévia do bloco selecionado">{prepared ? <Slide text={prepared} theme={theme} chords={chordBlocks?.[activeSlide]}/> : <span className="placeholder">Seu próximo conteúdo aparece aqui.</span>}</div><div className="slide-strip" aria-label="Selecionar bloco">{blocks.map((block,index) => <button key={index} className={`slide-thumb ${index === activeSlide ? 'active' : ''}`} aria-label={`Preparar bloco ${index + 1}`} aria-pressed={index === activeSlide} onClick={() => setSlide(index)}><span>{String(index+1).padStart(2,'0')}</span><small>{block.split('\n')[0]}</small></button>)}</div><p className="hint">Selecionar um bloco prepara a prévia. No modo apresentador, os botões de avançar e voltar também apresentam o slide. A edição e a seleção na biblioteca preservam a saída.</p></section></section>
      <aside className="right-column"><ProgramPanel program={program} programs={catalog.programs} dirty={programDirty} persisted={catalog.programs.some(p=>p.id===program.id)} change={setProgram} open={id=>void run(()=>openProgram(id),'Programação preparada')} create={newProgram} save={()=>void run(saveProgram,'Programação salva no computador')} add={()=>void run(async()=>addItem(),'Cópia adicionada; salve a programação')} canAdd={!!songText.trim()} load={loadItem} refresh={item=>void run(()=>refreshItem(item),'Atualização da cópia concluída')}/>
      <section className="panel live-panel" aria-label="Monitor ao vivo"><div className="section-heading"><h2>{state.mode === 'rehearsal' ? 'Tela do ensaio' : 'Ao vivo'}</h2><span className={`live-label ${!state.black && state.outputOpen ? 'on' : ''}`}>{!state.outputOpen ? 'ENCERRADA' : state.mode === 'rehearsal' ? state.black ? 'ENSAIO · TELA PRETA' : 'ENSAIO LOCAL' : state.black ? 'TELA PRETA' : 'NO DATASHOW'}</span></div><div className="preview live-preview" style={{aspectRatio:state.theme.ratio==='4:3'?'4 / 3':'16 / 9'}} aria-label="Conteúdo ao vivo">{state.black || !state.outputOpen ? <span className="placeholder">{state.outputOpen ? 'Tela preta' : 'Saída fechada'}</span> : <Slide text={state.hidden?'':state.text} theme={state.theme} chords={state.hidden?undefined:state.chords}/>}</div></section></aside>
    </div>
    <footer className="status-bar"><span role="status">{automatic.status.startsWith('Falha')?automatic.status:message || (ready ? 'Pronto para preparar sua apresentação' : 'Abrindo seus dados…')}</span><div className="presentation-actions"><button aria-label={presenterView ? "Apresentar bloco anterior" : "Preparar bloco anterior"} disabled={activeSlide === 0} onClick={() => navigate(-1)}>←</button><button aria-label={presenterView ? "Apresentar próximo bloco" : "Preparar próximo bloco"} disabled={activeSlide >= blocks.length-1} onClick={() => navigate(1)}>→</button><button className="primary" disabled={!ready || !state.outputOpen || !prepared.trim()} onClick={present}>Apresentar <span aria-hidden="true">↗</span></button></div><button disabled={!state.outputOpen} onClick={()=>run(()=>window.zamar.hideText(),'Visibilidade do texto atualizada')}>{state.hidden ? 'Mostrar texto' : 'Ocultar texto'}</button><button className="black-button" disabled={!state.outputOpen} onClick={() => run(() => window.zamar.black(), 'Estado da saída atualizado')}>{state.black ? 'Retomar conteúdo' : 'Tela preta'}<kbd>B</kbd></button></footer>
    {modal === 'import' && <Modal title="Importar texto ou cifra" close={()=>setModal(null)}><ImportContent complete={(kind,value)=>{setModal(null);void refreshSongs();void refreshCatalog();setTab(kind==='song'?'Músicas':'Textos');setQuery('');if(kind==='song')selectSong(value as Song);else selectText(value as TextContent);setMessage('Importação concluída e salva. Saída ativa preservada.');}}/></Modal>}
    {modal === 'recovery' && <Modal title="Recuperar última edição" close={()=>setModal(null)}><p>Conteúdos do último salvamento automático confirmado ({recovery?new Date(recovery.at).toLocaleString('pt-BR'):''}). Escolher um item prepara o editor; não inicia a projeção. Edições feitas antes da confirmação ou com campos inválidos podem não ter sido gravadas.</p>{recovery?.entries.map(e=><button className="recovery-entry" key={e.kind} onClick={()=>void run(()=>recoverEntry(e),'Última versão confirmada preparada')}>Preparar {e.kind==='draft'?'rascunho':e.kind==='song'?'música':e.kind==='program'?'programação':e.kind==='theme'?'tema':'texto'}: {typeof e.value==='string'?'Meu rascunho':e.value.title}</button>)}</Modal>}
    {modal === 'settings' && <Modal title="Configurações" close={() => setModal(null)}><h3>Dados locais</h3><p className="data-path">{path}</p><p>Mova a pasta data junto com o aplicativo. Edições válidas são salvas automaticamente após uma pausa de 1,2 segundo. Campos inválidos e falhas de gravação preservam a última versão confirmada. Os botões Salvar permitem confirmar imediatamente.</p><h3>Exportar músicas em JSON</h3><p>Exporte as letras sem acordes ou as músicas com cifras, preservando letra, acordes e tons. Os arquivos podem ser importados em lote pela biblioteca. Bíblias são gerenciadas na aba Bíblia: cadastrar, substituir, definir como padrão ou remover.</p><div className="editor-actions"><button disabled={maintenance} onClick={() => void exportSongs('lyrics')}>Exportar letras de músicas</button><button disabled={maintenance} onClick={() => void exportSongs('chords')}>Exportar cifras de músicas</button></div><h3>Recuperação de backups anteriores</h3><p>Para recuperar um backup completo anterior, use a restauração. Isso substitui os dados atuais após confirmação.</p><button disabled={maintenance} onClick={() => void backupAction(true)}>Restaurar backup</button><p className="data-path" role="status">{maintenanceMessage || 'Nenhuma operação em andamento.'}</p><h3>Aparência</h3><p>Alterne entre tema claro e escuro pelo botão no cabeçalho. Para mudar as cores da projeção, escolha ou crie um tema na área de prévia.</p></Modal>}
    {modal === 'help' && <Modal title="Sua primeira apresentação" close={() => setModal(null)}><ol className="guide"><li>Com um monitor, escolha Ensaio neste monitor. Com datashow, configure telas estendidas e selecione a saída externa.</li><li>Cadastre uma música, edite suas seções e sequência e clique em Salvar música. Ou prepare um texto livre.</li><li>Inicie a apresentação: os controles continuam aqui. Confira o bloco e clique em Apresentar.</li><li>Use Tela preta para interromper e Salvar texto para preservar o rascunho.</li></ol><p><kbd>Ctrl F</kbd> busca · <kbd>Ctrl Enter</kbd> apresenta · <kbd>B</kbd> alterna tela preta fora da edição. Esc encerra a apresentação. O oculta o texto. Setas avançam a apresentação no modo apresentador; no editor apenas preparam blocos.</p><p>Músicas são salvas com título, autor, seções e sequência. Programações e textos livres também podem ser salvos. Use [C] e [G/B] junto à letra para cadastrar cifras. Escolha os tons e o modo de exibição na música. Acordes desconhecidos são preservados com aviso.</p></Modal>}
    {modal === 'theme' && themeDraft && <Modal title="Tema de apresentação" close={closeModal}><ThemeEditor theme={themeDraft} change={setThemeDraft} save={()=>void run(saveTheme,'Tema salvo; saída preservada')} importImage={()=>void run(importImage,'Seleção de imagem concluída')}/><p role="status">{message}</p></Modal>}
    {modal === 'bible' && <Modal title="Importar Bíblia (.sql)" close={()=>{void window.zamar.cancelBibleImport();setModal(null);}}><BibleImport complete={()=>{setModal(null);setBibleRevision(n=>n+1);setMessage('Bíblia importada e salva neste computador');}}/></Modal>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

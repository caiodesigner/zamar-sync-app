import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Bridge, Monitor, Snapshot } from '../shared/contracts';
import './style.css';
declare global { interface Window { zamar: Bridge } }
const projection = new URLSearchParams(location.search).get('role') === 'output';
type Item = { id: string; title: string; kind: 'Música' | 'Texto'; text: string; detail: string };
const examples: Item[] = [
  { id: 'song-1', title: 'Uma nova canção', kind: 'Música', detail: 'Letra original · 2 blocos', text: 'Vamos juntos cantar\nUma nova canção\n\nNossa voz vai ecoar\nNeste lugar' },
  { id: 'song-2', title: 'Coração e voz', kind: 'Música', detail: 'Cifras de demonstração · tom C', text: '[C]Uma voz, uma canção\n[G]Um encontro, um coração\n\n[Am]Vamos juntos celebrar\n[F]Nossa história neste lugar' },
  { id: 'text-1', title: 'Seja bem-vindo', kind: 'Texto', detail: 'Mensagem de acolhimento', text: 'Seja bem-vindo!\nQue bom ter você aqui.\n\nVamos começar em instantes.' }
];
function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={close}><div className="section-heading"><h2 id="dialog-title">{title}</h2><button onClick={close} aria-label="Fechar janela">Fechar</button></div>{children}</dialog>;
}
function App() {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState('');
  const [title, setTitle] = useState('Meu rascunho');
  const [state, setState] = useState<Snapshot>({ revision: -1, text: '', black: true, outputOpen: false, mode: 'closed', status: 'Carregando' });
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
  const [queue, setQueue] = useState<Item[]>([]);
  const [modal, setModal] = useState<'help' | 'settings' | 'bible' | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const blocks = draft.split(/\n\s*\n/).filter(block => block.trim());
  const activeSlide = Math.min(slide, Math.max(0, blocks.length - 1));
  const prepared = blocks[activeSlide] ?? '';
  const dirty = draft !== saved;
  const update = (next: Snapshot) => setState(previous => next.revision >= previous.revision ? next : previous);
  useEffect(() => {
    const unsubscribe = window.zamar.onState(next => {
      update(next);
      if (!projection) window.zamar.initial().then(data => { setMonitors(data.monitors); setMonitor(current => current === 'rehearsal' || data.monitors.some(d => String(d.id) === current && d.availableForProjection) ? current : 'rehearsal'); }).catch(error => setMessage(String(error)));
    });
    window.zamar.initial().then(data => { setDraft(data.draft); setSaved(data.draft); setPath(data.dataPath); setMonitors(data.monitors); setMonitor(String(data.monitors.find(d => d.availableForProjection)?.id ?? 'rehearsal')); update(data.snapshot); setReady(true); }).catch(error => setMessage(String(error)));
    return unsubscribe;
  }, []);
  useEffect(() => { setPresenterView(state.outputOpen); }, [state.outputOpen]);
  useEffect(() => {
    if (projection || !dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  async function run(action: () => Promise<unknown>, success: string) { try { await action(); setMessage(success); } catch (error) { setMessage(String(error)); } }
  async function backupAction(restore: boolean) {
    setMaintenance(true); setMaintenanceMessage(restore ? 'Selecione o backup a restaurar…' : 'Escolha onde salvar o backup…');
    try {
      if (restore) {
        const result = await window.zamar.restoreBackup();
        if (result) { setDraft(result.draft); setSaved(result.draft); setTitle('Meu rascunho'); setQueue([]); setSlide(0); const data = await window.zamar.initial(); update(data.snapshot); setMaintenanceMessage(`Dados restaurados. Cópia anterior preservada em: ${result.previousBackup}`); setMessage('Restauração concluída'); }
        else setMaintenanceMessage('Restauração cancelada.');
      } else {
        const result = await window.zamar.createBackup();
        setMaintenanceMessage(result ? `Backup criado em: ${result}` : 'Backup cancelado.');
      }
    } catch (error) { setMaintenanceMessage(String(error)); setMessage(String(error)); }
    finally { setMaintenance(false); }
  }
  function load(item?: Item) {
    if (dirty && !window.confirm('Substituir o rascunho com alterações não salvas?')) return;
    setDraft(item?.text ?? ''); setTitle(item?.title ?? 'Novo texto'); setSlide(0); setMessage('Conteúdo preparado. A saída ao vivo não foi alterada.');
  }
  function present() { if (ready && state.outputOpen && prepared.trim()) void run(() => window.zamar.present(prepared), state.mode === 'rehearsal' ? 'Bloco apresentado no ensaio local' : 'Bloco enviado à projeção'); }
  useEffect(() => {
    if (projection) return;
    const handle = (event: KeyboardEvent) => {
      if (modal || event.defaultPrevented) return;
      const input = event.target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable);
      if (event.key === 'Escape' && state.outputOpen) { event.preventDefault(); void run(() => window.zamar.closeOutput(), 'Apresentação encerrada'); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); search.current?.focus(); }
      else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); present(); }
      else if (!input && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key.toLowerCase() === 'b' && state.outputOpen) { event.preventDefault(); void run(() => window.zamar.black(), 'Estado da saída atualizado'); }
        if (event.key === 'ArrowRight') { event.preventDefault(); setSlide(Math.min(activeSlide + 1, blocks.length - 1)); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); setSlide(Math.max(activeSlide - 1, 0)); }
      }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  });
  if (projection) return <main className="projection">{!state.black && <div>{state.text}</div>}</main>;
  const filtered = examples.filter(item => (tab === 'Músicas' ? item.kind === 'Música' : item.kind === 'Texto') && item.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  function move(index: number, offset: number) { setQueue(items => { const next = [...items]; const target = index + offset; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  return <main className={`operator ${presenterView && state.outputOpen ? 'presenting' : ''}`}>
    <header className="app-header"><a className="brand" href="#main-content" aria-label="Zamar Sync — ir ao conteúdo"><span className="brand-mark">Z</span><span>ZAMAR<span className="brand-light">SYNC</span></span></a><div className="header-caption"><h1>Sua mensagem em destaque.</h1><span>Espaço de apresentação</span></div><div className="header-actions"><span className="badge">● Offline</span><button className="quiet" onClick={() => setModal('help')}>Guia rápido</button><button className="quiet" onClick={() => setModal('settings')}>Configurações</button></div></header>
    <section className="output-bar" aria-label="Controle da saída"><span className={`status-dot ${state.outputOpen ? 'connected' : ''}`}/><label htmlFor="monitor">Destino da apresentação</label><select id="monitor" disabled={state.outputOpen} value={monitor} onChange={e => setMonitor(e.target.value)}><option value="rehearsal">Ensaio neste monitor · sem projeção externa</option>{monitors.filter(d => d.availableForProjection).map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select><button disabled={!ready || state.outputOpen} onClick={() => run(async () => { const opened = await window.zamar.openOutput(monitor === 'rehearsal' ? null : Number(monitor)); if (!opened) throw new Error('Uma apresentação já está aberta. Encerre antes de mudar o destino.'); }, monitor === 'rehearsal' ? 'Ensaio iniciado; controles disponíveis' : 'Apresentação iniciada no datashow')}>Iniciar apresentação</button><button className="quiet" disabled={!state.outputOpen} onClick={() => run(() => window.zamar.closeOutput(), 'Apresentação encerrada')}>Encerrar apresentação</button>{state.outputOpen && <button className="quiet" onClick={() => setPresenterView(value => !value)}>{presenterView ? 'Editar conteúdo' : 'Modo apresentador'}</button>}<span className="output-label">{state.mode === 'rehearsal' ? 'Ensaio local' : state.mode === 'external' ? 'Datashow ativo' : 'Apresentação encerrada'}</span></section>
    <div className="presentation-notice" aria-live="polite">{state.status}<span> Seus controles ficam neste monitor; a projeção em tela cheia usa somente uma tela separada.</span>{(state.mode === 'rehearsal' || !monitors.some(d => d.availableForProjection)) && <span> Para mostrar apenas o conteúdo no datashow, conecte-o e selecione Estender nas configurações de telas (Windows: Win+P → Estender). No modo Duplicar, as duas telas mostram a mesma imagem.</span>}</div>
    <div className="session-notice"><span className="prototype-tag">Prévia de experiência</span><span>Exemplos e programação são de demonstração e duram esta sessão. O botão Salvar preserva somente o texto do rascunho.</span></div>
    <div className="workspace" id="main-content">
      <aside className="library panel" aria-label="Biblioteca"><div className="section-heading"><h2>Biblioteca</h2><button className="icon-button" onClick={() => load()} aria-label="Preparar novo texto" disabled={!ready}>＋</button></div><label className="search-box"><span aria-hidden="true">⌕</span><input ref={search} aria-label="Buscar na biblioteca" placeholder="Buscar conteúdo…" value={query} onChange={e => setQuery(e.target.value)}/><kbd>Ctrl F</kbd></label><div className="tabs" role="tablist" aria-label="Tipo de conteúdo" onKeyDown={event => { const names = ['Músicas','Bíblia','Textos']; const index = names.indexOf(tab); const next = event.key === 'ArrowRight' ? (index+1)%3 : event.key === 'ArrowLeft' ? (index+2)%3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1; if (next < 0) return; event.preventDefault(); setTab(names[next]); setQuery(''); document.getElementById(`tab-${names[next]}`)?.focus(); }}>{['Músicas','Bíblia','Textos'].map(name => <button key={name} role="tab" aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} id={`tab-${name}`} aria-controls="library-results" onClick={() => { setTab(name); setQuery(''); }}>{name}</button>)}</div><div id="library-results" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === 'Bíblia' ? <div className="empty-state"><span className="empty-symbol" aria-hidden="true">▤</span><h3>Sua Bíblia, sempre por perto</h3><p>Cadastre uma tradução em arquivo .sql e consulte seus versículos offline.</p><button onClick={() => setModal('bible')}>Como importar uma Bíblia</button><small>Disponível em uma próxima etapa.</small></div> : <><p className="list-caption">CONTEÚDOS DE EXEMPLO · {filtered.length}</p><div className="library-list">{filtered.map(item => <button key={item.id} className={`library-item ${title === item.title ? 'selected' : ''}`} disabled={!ready} onClick={() => load(item)}><span className="item-icon" aria-hidden="true">{item.kind === 'Música' ? '♪' : 'T'}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span aria-hidden="true">›</span></button>)}{!filtered.length && <div className="empty-state"><h3>Nenhum resultado</h3><p>Tente outra palavra ou prepare um novo texto.</p><button onClick={() => {setQuery(''); search.current?.focus();}}>Limpar busca</button></div>}</div></>}
      </div><div className="library-note"><strong>Feito para o momento ao vivo.</strong><p>Escolha, confira e só então apresente.</p></div></aside>
      <section className="preparation" aria-label="Preparação"><div className="panel editor"><div className="section-heading"><div><span className="eyebrow">PREPARAR CONTEÚDO</span><h2>{title}</h2></div><span className="save-state">{dirty ? '● Não salvo' : '✓ Texto salvo'}</span></div><label className="editor-label" htmlFor="draft">Texto para apresentação <span>Uma linha em branco separa os blocos.</span></label><textarea id="draft" disabled={!ready} value={draft} onChange={e => {setDraft(e.target.value);setMessage('Alterações ainda não salvas');}} maxLength={100000} spellCheck lang="pt-BR"/><div className="editor-actions"><span className="muted">{blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'} · {draft.length.toLocaleString('pt-BR')} caracteres</span><button disabled={!ready} onClick={() => { const value = draft; void run(async () => {await window.zamar.save(value);setSaved(value);}, 'Salvo no computador');}}>Salvar texto</button></div></div>
      <section className="panel preview-panel"><div className="section-heading"><div><span className="eyebrow">PRÉVIA</span><h2>{presenterView && state.outputOpen ? 'Próximo conteúdo' : 'Confira antes de apresentar'}</h2></div><span className="counter">{blocks.length ? activeSlide + 1 : 0} / {blocks.length}</span></div><div className="preview prepared" aria-label="Prévia do bloco selecionado">{prepared || <span className="placeholder">Seu próximo conteúdo aparece aqui.</span>}</div><div className="slide-strip" aria-label="Selecionar bloco">{blocks.map((block,index) => <button key={index} className={`slide-thumb ${index === activeSlide ? 'active' : ''}`} aria-label={`Preparar bloco ${index + 1}`} aria-pressed={index === activeSlide} onClick={() => setSlide(index)}><span>{String(index+1).padStart(2,'0')}</span><small>{block.split('\n')[0]}</small></button>)}</div><p className="hint">Selecionar um bloco prepara a prévia. Apresentar atualiza a tela do ensaio ou o datashow.</p></section></section>
      <aside className="right-column"><section className="panel schedule" aria-label="Programação"><div className="section-heading"><div><span className="eyebrow">ESTA SESSÃO</span><h2>Programação</h2></div><span className="count-bubble">{queue.length}</span></div><button className="add-queue" disabled={!draft.trim()} onClick={() => {setQueue(items => [...items,{id:crypto.randomUUID(),title,kind:'Texto',text:draft,detail:'Rascunho desta sessão'}]);setMessage('Adicionado à programação desta sessão');}}>＋ Adicionar conteúdo preparado</button>{!queue.length ? <div className="empty-state compact"><span className="empty-symbol" aria-hidden="true">≡</span><h3>Organize o que vem a seguir</h3><p>Adicione o conteúdo preparado e ordene sua apresentação.</p></div> : <ol className="queue-list">{queue.map((item,index) => <li key={item.id}><button className="queue-title" onClick={() => load(item)}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.title}</strong></button><div className="queue-tools"><button aria-label={`Mover ${item.title} para cima`} disabled={index===0} onClick={() => move(index,-1)}>↑</button><button aria-label={`Mover ${item.title} para baixo`} disabled={index===queue.length-1} onClick={() => move(index,1)}>↓</button><button aria-label={`Remover ${item.title}`} onClick={() => setQueue(items => items.filter(i => i.id !== item.id))}>×</button></div></li>)}</ol>}<p className="hint">Esta lista não será recuperada ao fechar.</p></section>
      <section className="panel live-panel" aria-label="Monitor ao vivo"><div className="section-heading"><h2>{state.mode === 'rehearsal' ? 'Tela do ensaio' : 'Ao vivo'}</h2><span className={`live-label ${!state.black && state.outputOpen ? 'on' : ''}`}>{!state.outputOpen ? 'ENCERRADA' : state.mode === 'rehearsal' ? state.black ? 'ENSAIO · TELA PRETA' : 'ENSAIO LOCAL' : state.black ? 'TELA PRETA' : 'NO DATASHOW'}</span></div><div className="preview live-preview" aria-label="Conteúdo ao vivo">{state.black || !state.outputOpen ? <span className="placeholder">{state.outputOpen ? 'Tela preta' : 'Saída fechada'}</span> : state.text}</div></section></aside>
    </div>
    <footer className="status-bar"><span role="status">{message || (ready ? 'Pronto para preparar sua apresentação' : 'Abrindo seus dados…')}</span><div className="presentation-actions"><button aria-label="Preparar bloco anterior" disabled={activeSlide === 0} onClick={() => setSlide(activeSlide-1)}>←</button><button aria-label="Preparar próximo bloco" disabled={activeSlide >= blocks.length-1} onClick={() => setSlide(activeSlide+1)}>→</button><button className="primary" disabled={!ready || !state.outputOpen || !prepared.trim()} onClick={present}>Apresentar <span aria-hidden="true">↗</span></button></div><button className="black-button" disabled={!state.outputOpen} onClick={() => run(() => window.zamar.black(), 'Estado da saída atualizado')}>{state.black ? 'Retomar conteúdo' : 'Tela preta'}<kbd>B</kbd></button></footer>
    {modal === 'settings' && <Modal title="Configurações" close={() => setModal(null)}><h3>Dados locais</h3><p className="data-path">{path}</p><p>Mova a pasta data junto com o aplicativo. O salvamento do rascunho é manual nesta versão.</p><h3>Backup e recuperação</h3><p>Inclui o rascunho salvo, registros da biblioteca e anexos. A programação temporária e alterações não salvas não entram no backup.</p><div className="editor-actions"><button disabled={maintenance} onClick={() => void backupAction(false)}>Criar backup</button><button disabled={maintenance} onClick={() => void backupAction(true)}>Restaurar backup</button></div><p className="data-path" role="status">{maintenanceMessage || 'Nenhuma operação em andamento.'}</p><h3>Aparência</h3><p>Tema escuro para o operador e fundo preto com texto branco na projeção. A personalização de temas estará disponível em uma próxima versão.</p></Modal>}
    {modal === 'help' && <Modal title="Sua primeira apresentação" close={() => setModal(null)}><ol className="guide"><li>Com um monitor, escolha Ensaio neste monitor. Com datashow, configure telas estendidas e selecione a saída externa.</li><li>Escreva um texto ou selecione um exemplo da biblioteca.</li><li>Inicie a apresentação: os controles continuam aqui. Confira o bloco e clique em Apresentar.</li><li>Use Tela preta para interromper e Salvar texto para preservar o rascunho.</li></ol><p><kbd>Ctrl F</kbd> busca · <kbd>Ctrl Enter</kbd> apresenta · <kbd>B</kbd> alterna tela preta fora da edição. Esc encerra a apresentação. Setas preparam blocos; não mudam a saída sozinhas.</p><p>Exemplos, títulos e programação duram somente esta sessão. Cifras ainda são texto literal, sem transposição.</p></Modal>}
    {modal === 'bible' && <Modal title="Importar Bíblia (.sql)" close={() => setModal(null)}><span className="prototype-tag">Em desenvolvimento</span><ol className="guide"><li>Selecione um arquivo .sql já baixado.</li><li>Informe nome, tradução e idioma.</li><li>Confira o mapeamento de livros e versículos na prévia.</li><li>Confirme e consulte offline.</li></ol><p>O importador ainda não está disponível neste protótipo. Nenhum arquivo será selecionado ou processado aqui.</p></Modal>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

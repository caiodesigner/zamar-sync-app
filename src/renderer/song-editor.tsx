import React, { useState } from 'react';
import type { Song } from '../shared/songs';
export function newSong(): Song { const id = crypto.randomUUID(); return { id:crypto.randomUUID(),title:'',author:'',archived:false,sections:[{id,label:'Verso 1',text:''}],sequence:[id] }; }
export function SongEditor({song,change,save,dirty}: {song:Song; change:(song:Song)=>void; save:()=>void; dirty:boolean}) {
  const [selected,setSelected] = useState('');
  const sectionId = song.sections.some(s => s.id === selected) ? selected : song.sections[0].id;
  const section = song.sections.find(s => s.id === sectionId)!;
  const patch = (values:Partial<Song>) => change({...song,...values});
  const edit = (values:Partial<typeof section>) => patch({sections:song.sections.map(s => s.id === sectionId ? {...s,...values} : s)});
  return <><div className="section-heading"><h2>Editar música</h2><span className="save-state">{dirty ? '● Não salvo' : '✓ Música salva'}</span></div>
    <label className="field">Título<input aria-label="Título da música" maxLength={200} value={song.title} onChange={e=>patch({title:e.target.value})}/></label>
    <label className="field">Autor<input aria-label="Autor da música" maxLength={200} value={song.author} onChange={e=>patch({author:e.target.value})}/></label>
    <div className="section-heading"><h3>Seções</h3><button disabled={song.sections.length>=100} onClick={()=>{ const id=crypto.randomUUID(); patch({sections:[...song.sections,{id,label:`Seção ${song.sections.length+1}`,text:''}],sequence:[...song.sequence,id]}); setSelected(id); }}>Adicionar seção</button></div>
    <div className="section-tabs">{song.sections.map(s=><button key={s.id} aria-pressed={s.id===sectionId} onClick={()=>setSelected(s.id)}>{s.label}</button>)}</div>
    <label className="field">Nome da seção<input aria-label="Nome da seção" maxLength={100} value={section.label} onChange={e=>edit({label:e.target.value})}/></label>
    <label className="field">Letra da seção<textarea aria-label="Letra da seção" value={section.text} maxLength={100000} onChange={e=>edit({text:e.target.value})}/></label>
    <p className="hint">Linha em branco ou uma linha com --- inicia outro slide. Textos longos são divididos automaticamente.</p>
    <button disabled={song.sections.length===1} onClick={()=>{if(!window.confirm('Remover esta seção e todas as suas ocorrências na sequência?'))return; patch({sections:song.sections.filter(s=>s.id!==sectionId),sequence:song.sequence.filter(id=>id!==sectionId)});}}>Remover seção</button>
    <h3>Ordem da música</h3><p className="hint">Repita um refrão sem copiar sua letra. Editá-lo atualiza todas as ocorrências.</p>
    <ol className="sequence-list">{song.sequence.map((id,index)=><li key={`${id}-${index}`}><span>{song.sections.find(s=>s.id===id)?.label}</span><button aria-label={`Subir ocorrência ${index+1}`} disabled={!index} onClick={()=>{const sequence=[...song.sequence];[sequence[index-1],sequence[index]]=[sequence[index],sequence[index-1]];patch({sequence});}}>↑</button><button aria-label={`Descer ocorrência ${index+1}`} disabled={index===song.sequence.length-1} onClick={()=>{const sequence=[...song.sequence];[sequence[index+1],sequence[index]]=[sequence[index],sequence[index+1]];patch({sequence});}}>↓</button><button aria-label={`Remover ocorrência ${index+1}`} onClick={()=>patch({sequence:song.sequence.filter((_,i)=>i!==index)})}>×</button></li>)}</ol>
    <button disabled={song.sequence.length>=300} onClick={()=>patch({sequence:[...song.sequence,sectionId]})}>Repetir seção selecionada</button>
    <div className="editor-actions"><button onClick={()=>patch({archived:!song.archived})}>{song.archived ? 'Desarquivar música' : 'Arquivar música'}</button><button className="primary" onClick={save}>Salvar música</button></div><p className="hint">Arquivamento e edição são confirmados em Salvar música.</p>
  </>;
}

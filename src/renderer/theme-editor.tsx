import React from 'react';
import type { Theme } from '../shared/content';
import { Slide } from './slide';
export function ThemeEditor({theme,change,save,importImage}:{theme:Theme;change:(theme:Theme)=>void;save:()=>void;importImage:()=>void}) {
 const patch=(value:Partial<Theme>)=>change({...theme,...value});
 return <><label className="field">Nome do tema<input aria-label="Nome do tema" maxLength={200} value={theme.title} onChange={e=>patch({title:e.target.value})}/></label>
 <div className="theme-fields"><label className="field">Proporção<select aria-label="Proporção do tema" value={theme.ratio} onChange={e=>patch({ratio:e.target.value as Theme['ratio']})}><option>16:9</option><option>4:3</option></select></label>
 <label className="field">Fundo<input aria-label="Cor do fundo" type="color" value={theme.background} onChange={e=>patch({background:e.target.value})}/></label><label className="field">Texto<input aria-label="Cor do texto" type="color" value={theme.foreground} onChange={e=>patch({foreground:e.target.value})}/></label>
 <label className="field">Fonte<select aria-label="Fonte do tema" value={theme.font} onChange={e=>patch({font:e.target.value as Theme['font']})}><option value="mono">Monoespaçada</option><option value="sans">Sem serifa</option></select></label>
 <label className="field">Tamanho<input aria-label="Tamanho da fonte" type="number" min={32} max={96} value={theme.fontSize} onChange={e=>patch({fontSize:Number(e.target.value)})}/></label>
 <label className="field">Margem segura (%)<input aria-label="Margem segura" type="number" min={5} max={15} value={theme.margin} onChange={e=>patch({margin:Number(e.target.value)})}/></label>
 <label className="field">Alinhamento<select aria-label="Alinhamento" value={theme.align} onChange={e=>patch({align:e.target.value as Theme['align']})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
 <label className="field">Escurecer imagem<input aria-label="Escurecer imagem" type="range" min={0} max={0.8} step={0.05} value={theme.overlay} onChange={e=>patch({overlay:Number(e.target.value)})}/></label></div>
 <div className="editor-actions"><button onClick={importImage}>Importar imagem de fundo</button><button disabled={!theme.image} onClick={()=>patch({image:null})}>Remover imagem</button></div><p className="hint">PNG ou JPEG local, até 10 MiB. A imagem é copiada para seus dados; o original pode ser movido depois.</p>
 <div className="preview theme-preview" style={{aspectRatio:theme.ratio==='4:3'?'4 / 3':'16 / 9'}}><Slide text="Sua mensagem em destaque" theme={{...theme,columns:1}}/></div>
 <p className="hint">Edições válidas são salvas automaticamente na biblioteca. Salvar tema também o escolhe para a preparação. A saída ativa só muda ao apresentar novamente.</p><button className="primary" onClick={save}>Salvar tema</button></>;
}

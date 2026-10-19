import { chordRuns, type ChordPage } from '../shared/chords';
import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_THEME, imageUrl, slideGeometry, type Theme } from '../shared/content';
export function Slide({ text, theme=DEFAULT_THEME, chords }: { text:string; theme?:Theme; chords?:ChordPage }) {
 const ref=useRef<HTMLDivElement>(null);const [size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const geometry=slideGeometry(theme);const scale=Math.min(size.width/geometry.width,size.height/geometry.height);
 const lines=text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n');
 const chordRows=chords?.lines.map(chordRuns);
 const rowsPerColumn=Math.max(1,Math.ceil((chordRows?.length??lines.length)/geometry.columnCount));
 const groups=Array.from({length:geometry.columnCount},(_,i)=>({text:lines.slice(i*rowsPerColumn,(i+1)*rowsPerColumn),chords:chordRows?.slice(i*rowsPerColumn,(i+1)*rowsPerColumn)}));
 const cells=lines.reduce((max,line)=>Math.max(max,[...line].reduce((n,char)=>n+(/[^\u0000-\u024f\u0300-\u036f]/u.test(char)?2:1),0)),1);
 const chordCells=chordRows?.reduce((n,row)=>Math.max(n,row.reduce((v,u)=>v+u.cells,0)),1)??1;
 const font=chordRows?Math.min(theme.fontSize,geometry.innerHeight/rowsPerColumn/2.6,geometry.columnWidth/chordCells/(theme.font==='mono'?.72:1)):Math.min(theme.fontSize,geometry.innerHeight/rowsPerColumn/1.25,geometry.columnWidth/cells/(theme.font==='mono'?0.72:1));
 const justify=theme.align==='left'?'flex-start':theme.align==='right'?'flex-end':'center';
 return <div className="slide-surface" ref={ref}><div className="slide-canvas" style={{width:geometry.width,height:geometry.height,transform:`translate(-50%, -50%) scale(${scale})`,padding:`${geometry.y}px ${geometry.x}px`,fontSize:font,fontFamily:theme.font==='mono'?"'DejaVu Sans Mono','Courier New',monospace":"Arial,'DejaVu Sans',sans-serif",textAlign:theme.align,backgroundColor:theme.background,color:theme.foreground,backgroundImage:theme.image?`linear-gradient(rgba(0,0,0,${theme.overlay}),rgba(0,0,0,${theme.overlay})),url("${imageUrl(theme.image)}")`:'none',backgroundSize:'cover',backgroundPosition:'center'}}><div className="slide-columns" data-columns={geometry.columnCount} style={{display:'grid',gridTemplateColumns:`repeat(${geometry.columnCount},minmax(0,1fr))`,gap:geometry.columnGap,width:'100%',alignItems:'start'}}>{groups.map((group,column)=><div className="slide-column" key={column} style={{minWidth:0,whiteSpace:'pre-wrap'}}>{group.chords?<div className="chord-page" style={{width:'100%'}}>{group.chords.map((row,i)=><div className="chord-row" key={i} style={{display:'flex',justifyContent:justify,lineHeight:1.25}}>{row.map((u,j)=><span key={j} className="chord-unit" style={{display:'inline-flex',flexDirection:'column',flexShrink:0,width:u.cells*font*(theme.font==='mono'?.72:1),textAlign:'left'}}><span className="chord-token" style={{minHeight:'1.25em',whiteSpace:'pre'}}>{u.tokens.join(' ')}</span><span className="chord-lyric" style={{minHeight:'1.25em',whiteSpace:'pre'}}>{u.lyric}</span></span>)}</div>)}</div>:group.text.join('\n')}</div>)}</div></div></div>;
}

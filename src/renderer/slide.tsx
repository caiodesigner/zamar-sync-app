import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_THEME, imageUrl, slideGeometry, type Theme } from '../shared/content';
export function Slide({ text, theme=DEFAULT_THEME }: { text:string; theme?:Theme }) {
 const ref=useRef<HTMLDivElement>(null);const [size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const geometry=slideGeometry(theme);const scale=Math.min(size.width/geometry.width,size.height/geometry.height);
 const displayed=text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ');const lines=displayed.split('\n');
 const cells=lines.reduce((max,line)=>Math.max(max,[...line].reduce((n,char)=>n+(/[^\u0000-\u024f\u0300-\u036f]/u.test(char)?2:1),0)),1);
 const font=Math.min(theme.fontSize,geometry.innerHeight/Math.max(1,lines.length)/1.25,geometry.innerWidth/cells/(theme.font==='mono'?0.72:1));
 return <div className="slide-surface" ref={ref}><div className="slide-canvas" style={{width:geometry.width,height:geometry.height,transform:`translate(-50%, -50%) scale(${scale})`,padding:`${geometry.y}px ${geometry.x}px`,fontSize:font,fontFamily:theme.font==='mono'?"'DejaVu Sans Mono','Courier New',monospace":"Arial,'DejaVu Sans',sans-serif",textAlign:theme.align,justifyContent:theme.align==='left'?'flex-start':theme.align==='right'?'flex-end':'center',backgroundColor:theme.background,color:theme.foreground,backgroundImage:theme.image?`linear-gradient(rgba(0,0,0,${theme.overlay}),rgba(0,0,0,${theme.overlay})),url("${imageUrl(theme.image)}")`:'none',backgroundSize:'cover',backgroundPosition:'center'}}>{displayed}</div></div>;
}

import { useEffect,useRef,useState } from 'react';
import { validateAutoEntries, type AutoEntry, type SaveReceipt } from '../shared/autosave';
export function useAutosave(entries:AutoEntry[],epoch:string|null,paused:boolean,onSaved:(receipt:SaveReceipt,requested:AutoEntry[])=>void,onFailure?:()=>void){
 const [status,setStatus]=useState('Salvamento automático pronto'),[retry,setRetry]=useState(0);const busy=useRef(false),callback=useRef(onSaved),failure=useRef(onFailure),epochRef=useRef(epoch);callback.current=onSaved;failure.current=onFailure;epochRef.current=epoch;
 const serialized=JSON.stringify(entries);
 useEffect(()=>{
  if(!epoch||paused)return;let valid:AutoEntry[]=[];let invalid=false;for(const entry of entries){try{validateAutoEntries([entry]);valid.push(entry);}catch{invalid=true;}}
  if(!valid.length){setStatus(invalid?'Campos inválidos: última versão salva preservada. Corrija para salvar automaticamente.':'Gravação automática em dia');return;}
  if(busy.current)return;setStatus('Alterações pendentes · salvamento automático em instantes');
  const timer=setTimeout(()=>{busy.current=true;setStatus('Salvando automaticamente…');void window.zamar.autosave(epoch,valid).then(receipt=>{if(epochRef.current!==epoch)return;callback.current(receipt,valid);setStatus(invalid?'Parte salva; corrija os campos inválidos restantes.':'Gravação automática confirmada');}).catch(e=>{if(epochRef.current===epoch){setStatus(`Falha ao salvar: ${String(e)}. Última versão confirmada preservada.`);failure.current?.();}}).finally(()=>{busy.current=false;});},1200);
  return()=>clearTimeout(timer);
 },[serialized,epoch,paused,retry]);
 return {status,retry:()=>setRetry(n=>n+1)};
}

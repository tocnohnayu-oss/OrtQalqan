import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, ClipboardCheck, FileDown, PencilRuler, UserRound, X } from 'lucide-react';
import type { Language } from '../domain/types';
import { guideWords } from '../locales/guide';

export const GUIDE_PREFERENCE='ortqalqan.guide.v1';
type Box={x:number;y:number;width:number;height:number};
const sameBox=(a:Box|null,b:Box|null)=>a===b||!!a&&!!b&&Object.keys(a).every(key=>a[key as keyof Box]===b[key as keyof Box]);

/** A read-only tour of actual controls; no example building or data mutations. */
export function QuickGuide({language,welcome,onClose}:{language:Language;welcome:boolean;onClose:()=>void}){
  const w=guideWords(language),[step,setStep]=useState(welcome?-1:0),[spot,setSpot]=useState<Box|null>(null),[position,setPosition]=useState<{left:number;top:number}|null>(null),[limit,setLimit]=useState<number>();
  const dialog=useRef<HTMLDialogElement>(null),card=useRef<HTMLElement>(null),primary=useRef<HTMLButtonElement>(null);
  const restore=useRef({focus:document.activeElement,x:window.scrollX,y:window.scrollY});
  const id=useId().replaceAll(':',''),titleId=id+'-title',bodyId=id+'-body',current=w.steps[step];
  useEffect(()=>{
    return()=>{const previous=restore.current;dialog.current?.close();window.scrollTo(previous.x,previous.y);if(previous.focus instanceof HTMLElement&&previous.focus.isConnected)previous.focus.focus({preventScroll:true});};
  },[]);
  useLayoutEffect(()=>{const root=document.documentElement,previous=root.style.overflow;root.style.overflow='hidden';return()=>{root.style.overflow=previous;};},[]);
  useLayoutEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(!element.open)element.showModal();
    const target=current?document.querySelector<HTMLElement>(`[data-guide="${current.target}"]`):null;
    target?.scrollIntoView({block:window.innerWidth<=760?'start':'center',inline:'nearest',behavior:'instant'});
    if(target&&window.innerWidth<=760&&target.getBoundingClientRect().top<75)window.scrollBy({top:target.getBoundingClientRect().top-75,behavior:'instant'});
    if(card.current)card.current.scrollTop=0;
    const measure=()=>{
      const vw=document.documentElement.clientWidth,vh=window.innerHeight,box=target?.getBoundingClientRect(),content=card.current?.getBoundingClientRect();
      if(!content)return;
      let cut:Box|null=null;
      if(box&&box.width&&box.height){const x=Math.max(6,box.left-6),y=Math.max(6,box.top-6);cut={x,y,width:Math.max(0,Math.min(vw-6,box.right+6)-x),height:Math.max(0,Math.min(vh-6,box.bottom+6)-y)};}
      setSpot(old=>sameBox(old,cut)?old:cut);
      const width=content.width,pad=14;
      let height=Math.min((card.current?.scrollHeight||content.height)+4,vh-pad*2);
      let left=(vw-width)/2,top=(vh-height)/2;
      if(cut){
        if(vw>760&&cut.x+cut.width+24+width<=vw-pad){left=cut.x+cut.width+24;top=cut.y;}
        else if(vw>760&&cut.x-24-width>=pad){left=cut.x-24-width;top=cut.y;}
        else if(cut.y+cut.height+18+height<=vh-pad)top=cut.y+cut.height+18;
        else if(cut.y-18-height>=pad)top=cut.y-height-18;
        else{const below=vh-pad-cut.y-cut.height-18,above=cut.y-18-pad;if(below>=above){height=Math.max(130,below);top=cut.y+cut.height+18;}else{height=Math.max(130,above);top=cut.y-height-18;}}
      }
      setLimit(Math.floor(height));
      const next={left:Math.round(Math.max(pad,Math.min(vw-width-pad,left))),top:Math.round(Math.max(pad,Math.min(vh-height-pad,top)))};
      setPosition(old=>old?.left===next.left&&old.top===next.top?old:next);
    };
    measure();primary.current?.focus({preventScroll:true});
    const observer=new ResizeObserver(measure);if(card.current)observer.observe(card.current);if(target)observer.observe(target);
    window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
    let alive=true;void document.fonts.ready.then(()=>{if(alive)measure();});
    return()=>{alive=false;observer.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
  },[step,language]);
  const icons=[Building2,PencilRuler,ClipboardCheck,FileDown,UserRound];
  return <dialog ref={dialog} className="quick-guide" aria-labelledby={titleId} aria-describedby={bodyId} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <svg className="guide-spotlight" width="100%" height="100%" aria-hidden="true"><defs><mask id={id+'-mask'}><rect width="100%" height="100%" fill="white"/>{spot&&<rect {...spot} fill="black"/>}</mask></defs><rect width="100%" height="100%" fill="#1c343a" opacity=".5" mask={`url(#${id}-mask)`}/>{spot&&<rect {...spot} fill="none" stroke="#fffdf8" strokeWidth="2"/>}</svg>
    <section ref={card} className={`guide-card ${step<0?'guide-welcome':''}`} style={{...position,maxHeight:limit}}>
      <button className="guide-close icon-button" aria-label={w.close} onClick={onClose}><X size={19}/></button>
      <span className="guide-eyebrow">{step<0?w.eyebrow:`${w.step} ${step+1} ${w.of} ${w.steps.length}`}</span>
      <div className="guide-copy" aria-live="polite"><h2 id={titleId}>{current?.title||w.welcomeTitle}</h2><p id={bodyId}>{current?.body||w.welcomeBody}</p>{current?.note&&<small>{current.note}</small>}</div>
      {step<0?<div className="guide-route" aria-hidden="true">{icons.map((Icon,index)=><span key={index}><Icon size={25}/><small>{String(index+1).padStart(2,'0')}</small></span>)}</div>:<div className="guide-progress" aria-hidden="true">{w.steps.map((item,index)=><span className={index===step?'active':index<step?'done':''} key={item.target}/>)}</div>}
      <div className="guide-actions"><button className="button subtle" onClick={()=>step<=0?onClose():setStep(n=>n-1)}>{step<=0?w.later:<><ArrowLeft size={15}/>{w.back}</>}</button><button className="button primary" ref={primary} onClick={()=>step===w.steps.length-1?onClose():setStep(n=>n+1)}>{step<0?w.start:step===w.steps.length-1?w.finish:w.next}{step===w.steps.length-1?<Check size={16}/>:<ArrowRight size={16}/>}</button></div>
    </section>
  </dialog>;
}

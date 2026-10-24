import { rectPoints } from '../domain/layout.mjs';
import { decorateBlocks } from '../domain/block-layout.mjs';

/** Explicit synthetic training object. Never a reconstruction of NIS or an inspection record.
 * @returns {import('../domain/types').Building}
 */
export function createShowcase({id=crypto.randomUUID(),date=new Date().toLocaleDateString('en-CA')}={}){
  const zone=(key,name,nameKk,area,hazard,sensitive=false,existing=1)=>({id:`${id}-${key}`,name,nameKk,area,hazard,sensitive,existing,category:'public',temperature:'normal',automatic:'no'});
  const zones=[zone('library','Библиотека','Кітапхана',400,'A'),zone('classroom','Класс','Сынып',48,'A'),zone('server','Серверная','Сервер бөлмесі',24,'E',true,0),zone('lab','Лаборатория','Зертхана',42,'special',false,0)];
  zones[0].assets=[{id:`${id}-asset`,label:'DEMO-01',model:'Учебная запись / Оқу жазбасы',type:'OP',condition:'unknown',nextService:''}];
  zones[3].notes='Учебный пример: состав реагентов требует уточнения. Оқу мысалы: реагенттердің құрамын нақтылау қажет.';
  const room=(key,preset,x,y,width,height,index)=>({id:`${id}-room-${key}`,zoneId:index===undefined?undefined:zones[index].id,name:index===undefined?'Коридор':zones[index].name,nameKk:index===undefined?'Дәліз':zones[index].nameKk,points:rectPoints(x,y,width,height),preset,autoOpenings:true});
  const layout=decorateBlocks({version:1,example:true,rooms:[room('library','library',0,0,20,20,0),room('classroom','classroom',22,0,8,6,1),room('server','server',22,6,4,6,2),room('lab','lab',22,12,7,6,3),room('corridor','corridor',20,0,2,20)],openings:[]});
  layout.openings.push({id:`${id}-entry`,roomId:`${id}-room-corridor`,edge:2,position:.5,width:1,type:'door',hinge:'start',swing:'out'});
  return {id,name:'Учебный корпус · пример',nameKk:'Оқу корпусы · мысал',address:'',addressKk:'',inspector:'',date,demo:true,revision:1,kind:'education',usage:'public',floors:[{id:`${id}-floor`,name:'Первый этаж',nameKk:'Бірінші қабат',zones,markers:[],layout}]};
}

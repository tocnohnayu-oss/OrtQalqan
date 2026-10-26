import { createShowcase } from './showcase.mjs';
import { rectPoints } from '../domain/layout.mjs';
import { decorateBlocks } from '../domain/block-layout.mjs';

/** Authored synthetic teaching data. Created only by an explicit atlas example action. */
export function createAtlasShowcase({id=crypto.randomUUID(),date=new Date().toLocaleDateString('en-CA')}={}) {
  const building=createShowcase({id,date});building.name='Учебный корпус · атлас';building.nameKk='Оқу корпусы · атлас';
  const floor=(key,name,nameKk,specs)=>{
    const zones=[],rooms=specs.map(([preset,ru,kk,x,y,width,height,common],index)=>{
      const roomId=`${id}-${key}-room-${index}`,zoneId=common?undefined:`${id}-${key}-zone-${index}`;
      if(zoneId)zones.push({id:zoneId,name:ru,nameKk:kk,area:width*height,hazard:'A',category:'public',sensitive:false,temperature:'normal',automatic:'no',existing:0});
      return {id:roomId,zoneId,name:ru,nameKk:kk,preset,points:rectPoints(x,y,width,height),autoOpenings:true};
    });
    return {id:`${id}-${key}`,name,nameKk,zones,markers:[],layout:decorateBlocks({version:1,example:true,rooms,openings:[]})};
  };
  building.floors.push(floor('teaching','Второй этаж','Екінші қабат',[
    ['classroom','Класс 201','201-сынып',0,0,8,6],['classroom','Класс 202','202-сынып',8,0,8,6],['classroom','Класс 203','203-сынып',16,0,8,6],
    ['classroom','Класс 204','204-сынып',0,8,8,6],['classroom','Класс 205','205-сынып',8,8,8,6],['classroom','Класс 206','206-сынып',16,8,8,6],
    ['office','Учительская','Мұғалімдер бөлмесі',24,8,6,6],['office','Кабинет психолога','Психолог кабинеті',24,0,6,6],['corridor','Коридор','Дәліз',0,6,30,2,true],
  ]),floor('sports','Третий этаж','Үшінші қабат',[
    ['gym','Спортивный зал','Спорт залы',0,0,24,14],['generic','Раздевалка 1','1-киім ауыстыру бөлмесі',24,0,5,7],['generic','Раздевалка 2','2-киім ауыстыру бөлмесі',29,0,5,7],
    ['meeting','Комната тренеров','Жаттықтырушылар бөлмесі',24,7,10,7],['corridor','Коридор','Дәліз',0,14,34,2,true],
  ]));
  return building;
}

import type { Building, BuildingKind, Zone } from '../domain/types';
const rooms:Record<BuildingKind,[string,string][]> = {
  education:[['Учебное помещение','Оқу бөлмесі'],['Библиотека','Кітапхана']],
  office:[['Рабочая зона','Жұмыс аймағы'],['Переговорная','Келіссөз бөлмесі'],['Серверная','Сервер бөлмесі']],
  retail:[['Торговый зал','Сауда залы'],['Подсобное помещение','Қосалқы бөлме']],
  warehouse:[['Зона хранения','Сақтау аймағы'],['Зона приёмки','Қабылдау аймағы']],
  industrial:[['Производственный участок','Өндіріс учаскесі'],['Техническое помещение','Техникалық бөлме']],
  other:[],
};
export const kindNames = {
  ru:{education:'Учебное заведение',office:'Офис',retail:'Магазин',warehouse:'Склад',industrial:'Производство',other:'Другой объект'},
  kk:{education:'Оқу орны',office:'Кеңсе',retail:'Дүкен',warehouse:'Қойма',industrial:'Өндіріс',other:'Басқа нысан'},
};
/** Templates provide a room structure only. They never invent areas, fire classes or categories. */
export function createBuilding(kind:BuildingKind):Building {
  const zones:Zone[]=rooms[kind].map(([name,nameKk])=>({id:crypto.randomUUID(),name,nameKk,area:0,hazard:'special',category:'public',sensitive:false,temperature:'unknown',automatic:'unknown',existing:0}));
  return {id:crypto.randomUUID(),kind,usage:['education','office','retail'].includes(kind)?'public':kind==='warehouse'?'storage':kind==='industrial'?'production':'unknown',name:kindNames.ru[kind],nameKk:kindNames.kk[kind],address:'',addressKk:'',inspector:'',date:new Date().toLocaleDateString('en-CA'),demo:false,revision:1,floors:[{id:crypto.randomUUID(),name:'Первый этаж',nameKk:'Бірінші қабат',zones,markers:[]}]};
}

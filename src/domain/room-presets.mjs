/** Room kits describe diagram symbols and initial dimensions, never fire classes or safe capacity. */
/** @type {Record<import('./types').RoomPreset,{name:string;nameKk:string;width:number;height:number;common?:boolean;windows?:boolean}>} */
export const ROOM_PRESETS={
  classroom:{name:'Класс',nameKk:'Сынып',width:8,height:6,windows:true},
  library:{name:'Библиотека',nameKk:'Кітапхана',width:6,height:6,windows:true},
  lab:{name:'Лаборатория',nameKk:'Зертхана',width:7,height:6,windows:true},
  gym:{name:'Спортзал',nameKk:'Спорт залы',width:12,height:8,windows:true},
  office:{name:'Кабинет',nameKk:'Кабинет',width:6,height:4,windows:true},
  meeting:{name:'Переговорная',nameKk:'Келіссөз бөлмесі',width:6,height:4,windows:true},
  server:{name:'Серверная',nameKk:'Сервер бөлмесі',width:4,height:4},
  shop:{name:'Торговый зал',nameKk:'Сауда залы',width:10,height:8,windows:true},
  storage:{name:'Склад',nameKk:'Қойма',width:8,height:6},
  workshop:{name:'Цех',nameKk:'Цех',width:10,height:8},
  loading:{name:'Приёмка',nameKk:'Қабылдау',width:6,height:5},
  corridor:{name:'Коридор',nameKk:'Дәліз',width:14,height:2,common:true},
  stairs:{name:'Лестница',nameKk:'Баспалдақ',width:3,height:5,common:true},
  toilet:{name:'Санузел',nameKk:'Санитарлық торап',width:3,height:4},
  generic:{name:'Помещение',nameKk:'Бөлме',width:6,height:4,windows:true},
};
export const BUILDING_KITS={
  education:['classroom','library','lab','gym','server','corridor','stairs','toilet'],
  office:['office','meeting','server','corridor','stairs','toilet'],
  retail:['shop','storage','office','corridor','toilet'],
  warehouse:['storage','loading','office','corridor','stairs'],
  industrial:['workshop','storage','office','server','corridor','toilet'],
  other:['generic','office','storage','corridor','stairs','toilet'],
};
export function presetForZone(zone) {
  const name=`${zone.name} ${zone.nameKk}`.toLowerCase();
  if(/учеб|класс|оқу|сынып/.test(name))return 'classroom';
  if(/библиот|кітап|медиат/.test(name))return 'library';
  if(/лаборат|зертхан/.test(name))return 'lab';
  if(/спорт/.test(name))return 'gym';
  if(/сервер/.test(name))return 'server';
  if(/переговор|келіссөз/.test(name))return 'meeting';
  if(/рабоч|жұмыс|кабинет/.test(name))return 'office';
  if(/торгов|сауда/.test(name))return 'shop';
  if(/склад|хранен|қойма|сақтау/.test(name))return 'storage';
  if(/производ|өндіріс|цех/.test(name))return 'workshop';
  if(/приём|қабылдау/.test(name))return 'loading';
  return 'generic';
}

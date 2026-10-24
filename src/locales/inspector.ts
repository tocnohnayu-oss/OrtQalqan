import type { Language } from '../domain/types';

const words={
  ru:{previous:'Предыдущее помещение',next:'Следующее помещение',position:'Помещение',of:'из',locate:'Показать на плане',notPlaced:'Ещё не на плане',marked:'Есть метка на изображении',drawingArea:'На чертеже',differentArea:'Площади различаются',areaHint:'Для расчёта используется введённая площадь.',refresh:'Обновить результат',refreshHint:'Пересчитать объект по текущим данным',reason:'Обоснование расчёта',result:'Предварительный результат'},
  kk:{previous:'Алдыңғы бөлме',next:'Келесі бөлме',position:'Бөлме',of:'/',locate:'Жоспардан көрсету',notPlaced:'Жоспарда әлі жоқ',marked:'Суретте белгі бар',drawingArea:'Сызбада',differentArea:'Аудандар әртүрлі',areaHint:'Есептеуге енгізілген аудан қолданылады.',refresh:'Нәтижені жаңарту',refreshHint:'Ағымдағы деректер бойынша нысанды қайта есептеу',reason:'Есептің негіздемесі',result:'Алдын ала нәтиже'}
};
export const inspectorWords=(language:Language)=>words[language];

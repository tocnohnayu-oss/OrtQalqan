import type { Building, Zone } from '../domain/types';
const zone = (id: string, name: string, nameKk: string, area: number, hazard: Zone['hazard'] = 'A', existing = 1, sensitive = false): Zone => ({ id, name, nameKk, area, hazard, category: 'public', sensitive, temperature: 'normal', automatic: 'no', existing });
export const createDemo = (): Building => ({
  id: 'nis-demo', name: 'НИШ ЕМН · Петропавловск', nameKk: 'ЖМБ НЗМ · Петропавл',
  address: 'ул. Искака Ибраева, 22А', addressKk: 'Ысқақ Ыбыраев көшесі, 22А',
  inspector: '', date: new Date().toISOString().slice(0, 10), demo: true, revision: 1,
  floors: [
    { id: 'f1', name: 'Первый этаж', nameKk: 'Бірінші қабат', markers: [], zones: [zone('z1', 'Учебные кабинеты', 'Оқу кабинеттері', 240, 'AE', 1), zone('z2', 'Библиотека', 'Кітапхана', 180, 'A', 1), zone('z3', 'Серверная', 'Сервер бөлмесі', 36, 'E', 0, true), zone('z4', 'Спортивный зал', 'Спорт залы', 320, 'A', 2)] },
    { id: 'f2', name: 'Второй этаж', nameKk: 'Екінші қабат', markers: [], zones: [zone('z5', 'Учебные кабинеты', 'Оқу кабинеттері', 360, 'AE', 2), zone('z6', 'Лаборатория', 'Зертхана', 72, 'special', 1), zone('z7', 'Медиатека', 'Медиатека', 120, 'AE', 1)] },
    { id: 'f3', name: 'Третий этаж', nameKk: 'Үшінші қабат', markers: [], zones: [zone('z8', 'Учебные кабинеты', 'Оқу кабинеттері', 280, 'AE', 1), zone('z9', 'Актовый зал', 'Мәжіліс залы', 200, 'A', 1)] },
  ],
});

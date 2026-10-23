import type { Floor, Snapshot, Language } from '../domain/types';
import { translator } from '../locales';

export function Diagram({ floor, snapshot, selected, onSelect, language, stale }: { floor: Floor; snapshot: Snapshot; selected: string; onSelect: (id: string) => void; language: Language; stale: boolean }) {
  const t = translator(language);
  const columns = Math.max(2, Math.ceil(floor.zones.length / 2));
  const width = Math.max(700, columns * 220 + 100);
  const cell = (width - 120) / columns;
  return <svg className="floor-diagram" viewBox={`0 0 ${width} 510`} role="group" aria-label={`${language === 'ru' ? floor.name : floor.nameKk}. ${t('noScale')}`}>
    <defs><pattern id="diagram-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#d8dfdb" /></pattern></defs>
    <rect width={width} height="510" fill="url(#diagram-grid)" />
    <path d={`M45 62H${width-45}V440H45Z`} fill="#fff" stroke="#b4bfba" strokeWidth="3" />
    <rect x="61" y="222" width={width-122} height="62" fill="#f3f5f1" />
    <path d={`M61 222H${width-61}M61 284H${width-61}`} stroke="#cbd3cd" strokeWidth="1.5" />
    <text x={width/2} y="259" textAnchor="middle" className="diagram-corridor">{language === 'ru' ? 'ПРОХОД · УСЛОВНАЯ СХЕМА' : 'ӨТУ ЖОЛЫ · ШАРТТЫ СЫЗБА'}</text>
    {floor.zones.map((z, i) => {
      const x = 61 + (i % columns) * cell, y = i < columns ? 78 : 284;
      const h = 144, w = cell, active = selected === z.id;
      const row = snapshot.rows.find(r => r.zoneId === z.id);
      const issue = !row?.type || row.issues.length > 0;
      const label = language === 'ru' ? z.name : z.nameKk;
      return <g key={z.id} role="button" tabIndex={0} aria-label={`${label}, ${z.area} ${t('sqm')}`} aria-pressed={active} onClick={() => onSelect(z.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(z.id); } }} className={`diagram-zone ${active ? 'selected' : ''}`}>
        <rect x={x+4} y={y+3} width={w-8} height={h-6} rx="3" fill={active ? '#e8f0e9' : '#fff'} stroke={active ? '#317669' : '#d4dcd6'} strokeWidth={active ? 2.5 : 1.3} />
        <path d={`M${x+w/2-14} ${i<columns?y+h:y}h28`} stroke={active?'#e8f0e9':'#fff'} strokeWidth="5" />
        <text x={x+20} y={y+31} className="diagram-zone-index">{String(i+1).padStart(2,'0')} · {z.hazard==='special' ? '—' : z.hazard.replace('AE','A / E')}</text>
        <foreignObject x={x+20} y={y+44} width={w-40} height="42"><div className="diagram-name">{label}</div></foreignObject>
        <text x={x+20} y={y+104} className="diagram-area">{z.area.toLocaleString(language==='ru'?'ru-RU':'kk-KZ')} {t('sqm')}</text>
        <g transform={`translate(${x+w-63},${y+88})`}>
          <rect width="44" height="30" rx="6" fill={issue ? '#faf0d7' : '#f1f4f0'} />
          <text x="22" y="20" textAnchor="middle" className="diagram-count" fill={issue?'#8c6a27':'#245d50'}>{stale ? '· ·' : row?.type ? `${row.type==='OP'?'ОП':'ОУ'} ${row.count}` : '?'}</text>
        </g>
      </g>;
    })}
    <g transform="translate(58 455)"><path d="M0 15V0h15M6 10l9-9" fill="none" stroke="#65776c" strokeWidth="1.5" /><text x="25" y="12" className="diagram-legend">{t('noScale')}</text></g>
    <text x={width-60} y="467" textAnchor="end" className="diagram-legend">ORTQALQAN / {floor.id.toUpperCase().slice(0,8)}</text>
  </svg>;
}

import { Document, Page, Text, View, Font, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import type { Snapshot, Language } from '../domain/types';
import { translator, issueKey } from '../locales';
import { SOURCE_URL } from '../domain/calculator.mjs';
import { fieldWords } from '../locales/inspection';
import { buildingWords } from '../locales/objects';
import { kindNames } from '../data/templates';
import { PlanPDF } from './PlanPDF';
import { AttentionPDF } from './AttentionPDF';
import { planWords } from '../locales/plan';
import { CHECK_KEYS, inspectionStatus, inspectionSummary, serviceStatus } from '../domain/inspection.mjs';
import type { Inspection } from '../domain/types';

Font.register({ family: 'Noto', fonts: [{ src:'/fonts/NotoSans-Regular.ttf', fontWeight:400 }, { src:'/fonts/NotoSans-Bold.ttf', fontWeight:700 }] });
const s = StyleSheet.create({
  page:{ padding:38, paddingBottom:55, fontFamily:'Noto', fontSize:9, color:'#30352f' },
  brand:{ fontSize:22, fontWeight:700, color:'#b64c32', marginBottom:6 },
  subtitle:{ fontSize:9, color:'#68746f', marginBottom:22 },
  title:{ fontSize:17, fontWeight:700, marginBottom:12 },
  heading:{ fontSize:12, fontWeight:700, marginTop:20, marginBottom:9 },
  label:{ fontSize:8, color:'#74817a' },
  line:{ marginBottom:6 },
  notice:{ padding:12, backgroundColor:'#fbf5e7', marginVertical:12, lineHeight:1.6 },
  summary:{ flexDirection:'row', gap:20, padding:14, backgroundColor:'#f3f0e7', marginBottom:12 },
  large:{ fontSize:25, fontWeight:700 },
  row:{ flexDirection:'row', paddingVertical:8, borderBottomWidth:.5, borderBottomColor:'#dce3dc' },
  cell:{ flex:1, paddingRight:8 },
  nameCell:{ width:'39%', paddingRight:8 },
  footer:{ position:'absolute', bottom:25, left:38, right:38, fontSize:7, color:'#7b857f', flexDirection:'row', justifyContent:'space-between' },
  note:{ fontSize:8, lineHeight:1.6, marginBottom:6 },
  image:{ maxHeight:400, objectFit:'contain', marginVertical:10 },
});

function Report({ snapshot, language }: {snapshot:Snapshot; language:Language}) {
  const t=translator(language), b=snapshot.building, w=fieldWords(language), ow=buildingWords(language), summary=inspectionSummary(b), hasSupported=snapshot.rows.some(r=>r.type), p=planWords(language);
  const name=(x:{name:string;nameKk:string})=>language==='ru'?x.name:x.nameKk;
  return <Document title={`OrtQalqan — ${name(b)}`} author="OrtQalqan" language={language}>
    <Page size="A4" style={s.page}>
      <Text style={s.brand}>ortqalqan.</Text><Text style={s.subtitle}>{t('reportDraft')} · {snapshot.rulesVersion}</Text>
      <Text style={s.title}>{t('reportTitle')}</Text>
      <Text style={s.line}>{name(b)}</Text><Text style={s.line}>{language==='ru'?b.address:b.addressKk}</Text>
      <Text style={s.line}>{t('date')}: {b.date} · {t('inspector')}: {b.inspector || '—'}</Text>
      {b.kind&&<Text style={s.line}>{ow.type}: {kindNames[language][b.kind]} · {ow.scope}: {ow[b.usage||'public']}</Text>}
      {b.usage&&b.usage!=='public'&&<View style={s.notice}><Text>{ow.unsupportedUse}</Text></View>}
      {b.demo && <View style={s.notice}><Text>{t('demo')}. {t('demoNote')}</Text></View>}
      <Text style={s.heading}>{t('total')}</Text>
      <View style={s.summary}><View style={s.cell}><Text style={s.large}>{hasSupported?snapshot.totalOP:'—'}</Text><Text>ОП · {t('op')} · 4 кг ABC(E)</Text></View><View style={s.cell}><Text style={s.large}>{hasSupported?snapshot.totalOU:'—'}</Text><Text>ОУ · {t('ou')}</Text></View></View>
      <Text style={s.note}>{t('sourcesNote')}</Text><Text style={s.note}>{t('placement')}. {t('placementNote')}</Text>
      <Text style={s.heading}>{t('data')} / {t('result')}</Text>
      <View style={s.row}><Text style={s.nameCell}>{t('name')}</Text><Text style={s.cell}>{t('sqm')}</Text><Text style={s.cell}>{t('type')}</Text><Text style={s.cell}>{t('need')}</Text></View>
      {b.floors.map(f=><View key={f.id}>
        <Text style={{marginTop:12,fontWeight:700}}>{name(f)}</Text>
        {f.zones.map(z=>{const r=snapshot.rows.find(x=>x.zoneId===z.id)!;return <View key={z.id} style={s.row} wrap={false}><Text style={s.nameCell}>{name(z)} ({z.hazard==='special'?'?':z.hazard})</Text><Text style={s.cell}>{z.area}</Text><Text style={s.cell}>{r.type==='OP'?'ОП':r.type==='OU'?'ОУ':'—'}</Text><Text style={s.cell}>{r.type?r.count:'—'}</Text></View>;})}
        {snapshot.floorExtras.filter(x=>x.floorId===f.id).map((x,i)=><Text key={i} style={s.note}>{t('floorMinimum')}: {x.type==='OP'?'ОП':'ОУ'} +{x.count}</Text>)}
      </View>)}
      <Text style={s.heading}>{t('notes')}</Text>
      {snapshot.rows.filter(r=>r.issues.length).map(r=>{const z=b.floors.flatMap(f=>f.zones).find(z=>z.id===r.zoneId)!; return <View key={r.zoneId} style={{marginBottom:7}} wrap={false}><Text style={{fontWeight:700}}>{name(z)}</Text>{r.issues.map((key,i)=><Text key={i} style={s.note}>• {t(issueKey[key])}</Text>)}</View>;})}
      {b.floors.some(f=>f.zones.some(z=>z.notes?.trim()))&&<><Text style={s.heading}>{t('observations')}</Text>{b.floors.flatMap(f=>f.zones).filter(z=>z.notes?.trim()).map(z=><View key={z.id} style={{marginBottom:10}}><Text style={{fontWeight:700,marginBottom:4}}>{name(z)}</Text><Text style={s.note}>{z.notes}</Text></View>)}</>}
      <Text style={s.heading}>{t('source')}</Text>
      <Text style={s.note}>СТ РК 1487-2006: 5.2, 5.3, 5.9. {language==='ru'?'Правила пожарной безопасности РК: приложение 3, таблица 1, пункты 3 и 5.':'ҚР өрт қауіпсіздігі қағидалары: 3-қосымша, 1-кесте, 3 және 5-тармақтар.'}</Text>
      <Text style={s.note}>{t('formula')}: ОП ceil(S / 200); ОУ ceil(S / 400), E. {t('legalCheck')}</Text>
      <Text style={s.note}>{SOURCE_URL}</Text><Text style={s.note}>https://new-shop.ksm.kz/catalog/document/39181/</Text>
      <Text style={s.note}>{t('snapshot')}: {snapshot.id}. {t('sourceDate')}.</Text>
      <View style={s.footer} fixed><Text>OrtQalqan · {t('docStatus')}</Text><Text render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`} /></View>
    </Page>
    {b.floors.filter(f=>f.layout?.rooms.length).map(f=><Page size="A4" style={s.page} key={'layout-'+f.id}><Text style={s.brand}>ortqalqan.</Text><Text style={s.title}>{name(f)} · {p.view}</Text><Text style={s.note}>{f.layout?.example?p.sampleLabel:p.measurements}</Text><PlanPDF floor={f} language={language}/><Text style={{...s.note,marginTop:15}}>{p.areasSeparate} {t('placementNote')}</Text><View style={s.footer} fixed><Text>OrtQalqan · {p.drawing}</Text><Text render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`} /></View></Page>)}
    <AttentionPDF building={b} language={language} snapshotId={snapshot.id}/>
    {b.floors.some(f=>f.zones.some(z=>z.inspection||z.assets?.length))&&<Page size="A4" style={s.page}>
      <Text style={s.brand}>ortqalqan.</Text><Text style={s.title}>{w.summary}</Text><Text style={s.line}>{name(b)} · {w.date}: {b.date}</Text>
      <View style={s.summary}><View style={s.cell}><Text style={s.large}>{summary.visited} / {summary.total}</Text><Text>{w.visited}</Text></View><View style={s.cell}><Text style={s.large}>{summary.assets}</Text><Text>{w.assets}</Text></View></View>
      <Text style={s.note}>{w.summaryHint}</Text><Text style={s.note}>{w.registryHint}</Text>
      {b.floors.map(f=><View key={f.id}><Text style={s.heading} minPresenceAhead={60}>{name(f)}</Text>{f.zones.map(z=><View key={z.id}>
        <Text style={{fontWeight:700,marginTop:12,marginBottom:5}} minPresenceAhead={45}>{name(z)} · {w[inspectionStatus(z,b.date)]}{z.inspection?.checkedOn?` (${z.inspection.checkedOn})`:''}</Text>
        {z.inspection?(CHECK_KEYS as (keyof Pick<Inspection,'access'|'marking'|'passport'>)[]).map(key=><Text style={s.note} key={key}>{w[key]}: {w[z.inspection![key]==='attention'?'issue':z.inspection![key]]}</Text>):<Text style={s.note}>{w.noRecord}</Text>}
        {(z.assets||[]).map(a=><View key={a.id} style={s.row} wrap={false}><Text style={s.nameCell}>{a.label} · {a.type==='OP'?'ОП':'ОУ'}{a.model?` / ${a.model}`:''}</Text><Text style={s.cell}>{w[a.condition]}</Text><Text style={s.cell}>{a.nextService||'—'}{a.nextService?`\n${w[serviceStatus(a,b.date)]}`:''}</Text></View>)}
      </View>)}</View>)}
      <Text style={{...s.note,marginTop:18}}>{w.deadlineHint}</Text><View style={s.footer} fixed><Text>OrtQalqan · {w.eyebrow}</Text><Text render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`} /></View>
    </Page>}
    {b.floors.filter(f=>f.plan).map(f=><Page size="A4" style={s.page} key={f.id}><Text style={s.brand}>ortqalqan.</Text><Text style={s.title}>{name(f)} · {t('plan')}</Text><Image src={f.plan!} style={s.image}/><Text style={s.note}>{t('planOnly')}</Text><Text style={s.heading}>{t('placementCount')}: {f.markers.length}</Text>{f.markers.map((m,i)=><Text key={m.id} style={s.line}>{i+1}. {m.type==='OP'?'ОП':'ОУ'} · {name(f.zones.find(z=>z.id===m.zoneId)!)} · X {Math.round(m.x*100)}%, Y {Math.round(m.y*100)}%</Text>)}<Text style={s.note}>{t('placement')}. {b.demo?t('demoNote'):''}</Text><View style={s.footer} fixed><Text>OrtQalqan</Text><Text render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`} /></View></Page>)}
  </Document>;
}

export async function exportPDF(snapshot:Snapshot,language:Language) {
  return await pdf(<Report snapshot={snapshot} language={language}/>).toBlob();
}

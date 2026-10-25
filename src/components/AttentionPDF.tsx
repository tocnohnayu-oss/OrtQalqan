import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Building, Language } from '../domain/types';
import { ATTENTION_GROUPS, attentionItems } from '../domain/attention.mjs';
import { attentionReason, attentionSource, attentionWords } from '../locales/attention.mjs';

const s=StyleSheet.create({
  page:{padding:38,paddingBottom:55,fontFamily:'Noto',fontSize:9,color:'#253b42'},
  brand:{fontSize:22,fontWeight:700,color:'#b5452b',marginBottom:16},
  title:{fontSize:18,fontWeight:700,marginBottom:12},
  line:{fontSize:9,lineHeight:1.7,marginBottom:5},
  caption:{fontSize:8,lineHeight:1.7,color:'#52675a',marginBottom:7},
  group:{fontSize:13,fontWeight:700,marginTop:19,marginBottom:7},
  row:{borderBottomWidth:.5,borderBottomColor:'#c2cdbd',paddingVertical:10},
  name:{fontSize:11,fontWeight:700,marginBottom:5},
  note:{fontSize:9,lineHeight:1.7,marginTop:5,paddingLeft:9,borderLeftWidth:1,borderLeftColor:'#b98a69'},
  footer:{position:'absolute',bottom:25,left:38,right:38,fontSize:7,color:'#5b705e',flexDirection:'row',justifyContent:'space-between'},
});

/** Always derived from the report's immutable snapshot, never the live editor. */
export function AttentionPDF({building,language,snapshotId}:{building:Building;language:Language;snapshotId:string}) {
  const items=attentionItems(building);if(!items.length)return null;
  const w=attentionWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  return <Page size="A4" style={s.page}>
    <Text style={s.brand}>ortqalqan.</Text><Text style={s.title}>{w.title}</Text>
    <Text style={s.line}>{name(building)}</Text><Text style={s.line}>{w.referenceDate}: {building.date} · {w.records}: {items.length}</Text>
    {building.demo&&<Text style={s.caption}>{w.demo}</Text>}
    <Text style={s.caption}>{w.boundary}</Text><Text style={s.caption}>{w.referenceHint}</Text>
    {ATTENTION_GROUPS.map(group=>{
      const rows=items.filter(item=>item.group===group);if(!rows.length)return null;
      return <View key={group}>
        <Text style={s.group} minPresenceAhead={70}>{w[group as keyof typeof w]}</Text>
        <Text style={s.caption} minPresenceAhead={50}>{w[`${group}Hint` as keyof typeof w]}</Text>
        {rows.map(item=><View style={s.row} key={item.id}>
          <Text style={s.caption} minPresenceAhead={45}>{name(item.floor)} / {name(item.zone)}</Text>
          <Text style={s.name} minPresenceAhead={30}>{item.asset?`${item.asset.type==='OP'?'ОП':'ОУ'} · ${item.asset.label}${item.asset.model?` / ${item.asset.model}`:''}`:w.observation}</Text>
          {item.reasons.map(reason=><Text style={s.line} key={reason}>• {attentionReason(item,reason,language)}</Text>)}
          {item.kind==='room'&&item.zone.notes?.trim()&&<Text style={s.note}>{item.zone.notes}</Text>}
          <Text style={s.caption}>{attentionSource(item,building.date,language)}</Text>
        </View>)}
      </View>;
    })}
    <Text style={{...s.caption,marginTop:18}}>{w.snapshot}: {snapshotId} · {w.revision}: {building.revision}</Text>
    <View style={s.footer} fixed><Text>OrtQalqan · {w.title}</Text><Text render={({pageNumber,totalPages})=>`${pageNumber} / ${totalPages}`}/></View>
  </Page>;
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildingModel } from '../domain/building-model.mjs';
import { furniturePrimitives } from '../domain/furniture.mjs';
import { labelPoint } from '../domain/layout.mjs';
import { validModelCamera } from '../domain/model-session.mjs';

const colors={pending:'#f4f1e6',started:'#dce7d9',visited:'#a9cabc',attention:'#dfab87',verify:'#d8d4bd',OP:'#dfad8d',OU:'#a9cad5',manual:'#d8d4bd',stale:'#cfd6ca'};

/** Real WebGL scene; controls and GPU resources are owned by one mounted viewer. */
export function createBuildingScene(canvas,initial,{onReady,onPick,onError,onProject}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor('#edf0e7');
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,2000);
  scene.add(new THREE.HemisphereLight('#fffdf2','#718171',2.7));
  const sun=new THREE.DirectionalLight('#fff2d9',3.6);sun.position.set(-35,65,40);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.045;sun.shadow.bias=-.00015;scene.add(sun);scene.add(sun.target);
  const fill=new THREE.DirectionalLight('#d9e8f0',1.2);fill.position.set(30,25,-35);scene.add(fill);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;controls.dampingFactor=.09;
  controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.08;controls.minDistance=3;controls.maxDistance=800;controls.screenSpacePanning=true;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let config=initial,world=null,ground=null,frame=null,disposed=false,signature='',viewSignature='',first=true,frames=0;
  let center={x:0,y:0},fitBox=new THREE.Box3(),activeFitBox=null,activeFitZone='',targets=[],anchors=[],selection=null,selectionKey='';

  function disposeGroup(group){if(!group)return;const geometries=new Set(),materials=new Set();group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])materials.add(material);});for(const geometry of geometries)geometry.dispose();for(const material of materials){material.map?.dispose();material.dispose();}scene.remove(group);}
  function render(){
    frame=null;if(disposed)return;controls.update();renderer.render(scene,camera);canvas.dataset.frame=String(++frames);canvas.dataset.camera=[...camera.position.toArray(),...controls.target.toArray()].map(value=>value.toFixed(3)).join(',');
    const width=canvas.clientWidth,height=canvas.clientHeight;
    onProject?.({width,height,points:config.cut&&config.labelsOn?anchors.map(anchor=>{const point=anchor.position.clone().project(camera);return {id:anchor.id,x:(point.x+1)*width/2,y:(1-point.y)*height/2,depth:point.z};}):[]});
  }
  function requestRender(){if(!disposed&&frame===null)frame=requestAnimationFrame(render);}
  controls.addEventListener('change',requestRender);
  function shapeOf(points){const shape=new THREE.Shape();points.forEach((point,index)=>shape[index?'lineTo':'moveTo'](point.x-center.x,-(point.y-center.y)));shape.closePath();return shape;}
  function build(refit=false){
    disposeGroup(world);world=new THREE.Group();targets=[];anchors=[];selectionKey='';const model=buildingModel(config.building,config.height);if(!model.bounds){scene.add(world);return;}
    const b=model.bounds;center={x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2};const selectedIndex=config.building.floors.findIndex(floor=>floor.id===config.selected);
    const cube=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3();
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.88});
    const glassMaterial=new THREE.MeshStandardMaterial({color:'#96bac8',roughness:.18,metalness:.12,transparent:true,opacity:.55,depthWrite:false});
    const frameMaterial=new THREE.MeshStandardMaterial({color:'#536b68',roughness:.6});
    const doorMaterial=new THREE.MeshStandardMaterial({color:'#a06948',roughness:.85});
    const fittingMaterial=new THREE.MeshStandardMaterial({color:'#c5b897',roughness:.87});
    const slabMaterial=new THREE.MeshStandardMaterial({color:'#d5d8c8',roughness:1});
    const roofMaterial=new THREE.MeshStandardMaterial({color:'#4d6560',roughness:.9});
    const accentMaterial=new THREE.MeshBasicMaterial({color:'#b5452b'});
    const bucket=(group,pieces,material,kind)=>{
      if(!pieces.length)return;const mesh=new THREE.InstancedMesh(cube,material,pieces.length);mesh.castShadow=kind!=='glass';mesh.receiveShadow=kind!=='glass';mesh.userData={pieces,kind,floorId:group.userData.floorId};
      for(let i=0;i<pieces.length;i++){const piece=pieces[i];position.set(piece.x-center.x,piece.y,piece.z-center.y);scale.set(piece.width,piece.height,piece.depth);rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),piece.angle||0);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);if(kind==='wall')mesh.setColorAt(i,new THREE.Color(piece.color||'#ece9dd'));}
      group.add(mesh);targets.push(mesh);
    };
    for(const item of model.floors){
      if(config.cut&&item.index>selectedIndex)continue;
      const group=new THREE.Group();group.userData.floorId=item.floor.id;world.add(group);
      const cut=config.cut&&item.index===selectedIndex,top=cut?Math.min(1.15,item.height):item.height;
      const pieces={wall:[],glass:[],frame:[],door:[],fitting:[],accent:[]};
      const wallBox=(wall,bottom,height,kind='wall',thickness=.16)=>{
        if(height<=.005)return;const horizontal=Math.abs(wall.start.y-wall.end.y)<1e-6;
        const zoneId=wall.zoneIds[0],state=config.states[zoneId],color=config.layer==='rooms'?'#ece9dd':colors[state]||'#ece9dd';
        pieces[kind].push({x:(wall.start.x+wall.end.x)/2,z:(wall.start.y+wall.end.y)/2,y:item.base+bottom+height/2,
          width:horizontal?wall.length:thickness,depth:horizontal?thickness:wall.length,height,zoneId,color});
      };
      for(const wall of item.walls){
        if(!wall.external&&!cut)continue;
        if(wall.opening==='door'){
          const head=Math.min(2.12,item.height*.78);wallBox(wall,head,top-head);wallBox(wall,0,Math.min(top,head),'door',.045);
        }else if(wall.opening==='window'){
          const sill=Math.min(.92,item.height*.32),head=Math.min(2.2,item.height*.82);
          wallBox(wall,0,Math.min(top,sill));wallBox(wall,head,top-head);wallBox(wall,sill,Math.min(top,head)-sill,'glass',.035);
          if(top>sill){wallBox(wall,sill-.035,.055,'frame',.22);if(top>=head)wallBox(wall,head-.025,.055,'frame',.22);}
        }else wallBox(wall,0,top);
        if(wall.external&&!cut)wallBox(wall,top-.09,.09,'frame',.22);
        if(wall.external&&!config.cut&&item.floor.id===config.selected)wallBox(wall,.03,.065,'accent',.19);
      }
      for(const room of item.floor.layout.rooms){
        if(cut&&room.zoneId){const point=labelPoint(room.points);anchors.push({id:room.zoneId,position:new THREE.Vector3(point.x-center.x,item.base+.35,point.y-center.y)});}
        const slabGeometry=new THREE.ExtrudeGeometry(shapeOf(room.points),{depth:.14,bevelEnabled:false});
        const state=config.states[room.zoneId],slabColor=config.layer==='rooms'?(room.zoneId?'#ece5d3':'#dce2d2'):colors[state]||'#e3e7d7';
        const slab=new THREE.Mesh(slabGeometry,cut?new THREE.MeshStandardMaterial({color:slabColor,roughness:1}):slabMaterial);slab.rotation.x=-Math.PI/2;slab.position.y=item.base-.14;slab.receiveShadow=true;slab.userData={floorId:item.floor.id,zoneId:room.zoneId};group.add(slab);targets.push(slab);
        if(!cut){const roof=new THREE.Mesh(slabGeometry,roofMaterial);roof.rotation.x=-Math.PI/2;roof.position.y=item.base+item.height-.18;roof.castShadow=true;roof.receiveShadow=true;roof.userData={floorId:item.floor.id};group.add(roof);targets.push(roof);}
        if(cut){
          for(const fitting of furniturePrimitives(room)){
            if(fitting.tag!=='rect'||room.preset==='gym'||room.preset==='stairs')continue;const a=fitting.attrs;if(a.width<.22||a.height<.22)continue;
            let x=a.x+a.width/2,z=a.y+a.height/2,angle=0;
            const turn=a.transform?.match(/rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/);
            if(turn){angle=Number(turn[1])*Math.PI/180;const cx=Number(turn[2]),cy=Number(turn[3]),dx=x-cx,dz=z-cy;x=cx+dx*Math.cos(angle)-dz*Math.sin(angle);z=cy+dx*Math.sin(angle)+dz*Math.cos(angle);}
            const height=room.preset==='server'?1.65:room.preset==='library'||room.preset==='storage'?1.4:Math.min(a.width,a.height)<.4?.42:.73;
            pieces.fitting.push({x,z,y:item.base+height/2,width:a.width,depth:a.height,height,angle:-angle,zoneId:room.zoneId});
          }
        }
      }
      for(const kind of Object.keys(pieces))bucket(group,pieces[kind],kind==='wall'?wallMaterial:kind==='glass'?glassMaterial:kind==='door'?doorMaterial:kind==='frame'?frameMaterial:kind==='accent'?accentMaterial:fittingMaterial,kind);
    }
    scene.add(world);fitBox.setFromObject(world);
    const used=new Set();world.traverse(object=>{if(object.material)used.add(object.material);});for(const material of [wallMaterial,glassMaterial,frameMaterial,doorMaterial,fittingMaterial,slabMaterial,roofMaterial,accentMaterial])if(!used.has(material))material.dispose();
    if(ground){disposeGroup(ground);ground=null;}
    const size=Math.max(b.maxX-b.minX,b.maxY-b.minY,model.totalHeight,12),groundSize=size*3;
    ground=new THREE.Group();const plane=new THREE.Mesh(new THREE.PlaneGeometry(groundSize,groundSize),new THREE.MeshStandardMaterial({color:'#edf0e6',roughness:1}));plane.rotation.x=-Math.PI/2;plane.position.y=-.21;plane.receiveShadow=true;ground.add(plane);
    const grid=new THREE.GridHelper(groundSize,Math.min(70,Math.round(groundSize/2)),'#bac6b2','#d8e0d0');grid.position.y=-.2;grid.material.transparent=true;grid.material.opacity=.32;ground.add(grid);scene.add(ground);
    sun.shadow.camera.left=-size;sun.shadow.camera.right=size;sun.shadow.camera.top=size;sun.shadow.camera.bottom=-size;sun.shadow.camera.far=size*8;sun.shadow.camera.updateProjectionMatrix();sun.position.set(-size*1.1,size*2,size*1.1);sun.target.position.set(0,model.totalHeight/2,0);sun.target.updateMatrixWorld();
    canvas.dataset.floorCount=String(model.floors.length);canvas.dataset.meshes=String(targets.length);canvas.dataset.mode=config.cut?'cut':'whole';canvas.dataset.height=String(config.height);canvas.dataset.layer=config.layer;canvas.dataset.selectedFloor=config.selected;
    if(first){reset();first=false;}else if(refit)reset(false,true);requestRender();
  }
  function fit(box,top=false,preserveAngle=false){
    if(box.isEmpty())return;
    const size=box.getSize(new THREE.Vector3()),target=box.getCenter(new THREE.Vector3()),max=Math.max(size.x,size.y,size.z,8);
    const direction=preserveAngle?camera.position.clone().sub(controls.target).normalize():new THREE.Vector3(top?.06:.95,top?1:.78,top?.06:1.05).normalize();
    const corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
    controls.target.copy(target);camera.near=Math.max(.05,max/1000);camera.far=max*30;camera.updateProjectionMatrix();let lo=max*.6,hi=max*12;
    for(let step=0;step<22;step++){const distance=(lo+hi)/2;camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld();const extent=Math.max(...corners.map(point=>{const projected=point.clone().project(camera);return Math.max(Math.abs(projected.x),Math.abs(projected.y));}));if(extent>.84)lo=distance;else hi=distance;}
    camera.position.copy(target).addScaledVector(direction,hi);controls.minDistance=max*.12;controls.maxDistance=max*20;controls.update();requestRender();
  }
  function reset(top=false,preserveAngle=false){activeFitBox=null;activeFitZone='';fit(fitBox,top,preserveAngle);}
  function roomBox(zoneId){
    const floor=config.building.floors.find(item=>item.id===config.selected),room=floor?.layout?.rooms.find(item=>item.zoneId===zoneId);if(!room||!config.cut)return null;
    const base=config.building.floors.indexOf(floor)*config.height,box=new THREE.Box3();
    for(const point of room.points){box.expandByPoint(new THREE.Vector3(point.x-center.x,base,point.y-center.y));box.expandByPoint(new THREE.Vector3(point.x-center.x,base+1.5,point.y-center.y));}
    return box;
  }
  function focusRoom(zoneId){const box=roomBox(zoneId);if(!box)return;activeFitBox=box;activeFitZone=zoneId;fit(box,false,true);}
  function captureView(){return {position:camera.position.toArray(),target:controls.target.toArray(),aspect:camera.aspect,near:camera.near,far:camera.far,minDistance:controls.minDistance,maxDistance:controls.maxDistance,focusZone:activeFitZone};}
  function restoreView(saved){
    if(!validModelCamera(saved))return;
    camera.position.fromArray(saved.position);controls.target.fromArray(saved.target);camera.near=saved.near;camera.far=saved.far;camera.updateProjectionMatrix();controls.minDistance=saved.minDistance;controls.maxDistance=saved.maxDistance;
    activeFitBox=saved.focusZone?roomBox(saved.focusZone):null;activeFitZone=activeFitBox?saved.focusZone:'';controls.update();
    if(Math.abs(saved.aspect-camera.aspect)>.1)fit(activeFitBox||fitBox,false,true);requestRender();
  }
  function highlight(){
    const key=JSON.stringify([config.selected,config.selectedZone,config.cut,config.height]);if(key===selectionKey)return;selectionKey=key;disposeGroup(selection);selection=null;canvas.dataset.selectedZone=config.selectedZone||'';
    const floor=config.building.floors.find(item=>item.id===config.selected),room=floor?.layout?.rooms.find(item=>item.zoneId===config.selectedZone);if(!config.cut||!room)return;
    const base=config.building.floors.indexOf(floor)*config.height;selection=new THREE.Group();
    const fill=new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(room.points)),new THREE.MeshBasicMaterial({color:'#d25d36',transparent:true,opacity:.14,depthWrite:false}));fill.rotation.x=-Math.PI/2;fill.position.y=base+.025;selection.add(fill);
    const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(room.points.map(point=>new THREE.Vector3(point.x-center.x,base+.04,point.y-center.y))),new THREE.LineBasicMaterial({color:'#b5452b',depthTest:false,transparent:true,opacity:.9}));line.renderOrder=4;selection.add(line);scene.add(selection);
  }
  function rotate(yaw,pitch=0){const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta+=yaw;spherical.phi=THREE.MathUtils.clamp(spherical.phi+pitch,.08,Math.PI*.49);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();requestRender();}
  function zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();requestRender();}
  function update(next){config=next;const nextSignature=JSON.stringify([next.building.revision,next.building.id,next.selected,next.cut,next.height,next.layer,next.states]);if(signature!==nextSignature){signature=nextSignature;const nextView=JSON.stringify([next.selected,next.cut,next.height,next.building.floors.map(floor=>floor.layout)]),refit=nextView!==viewSignature;viewSignature=nextView;build(refit);}highlight();requestRender();}
  const resize=()=>{const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;const previous=camera.aspect;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(Math.abs(previous-camera.aspect)>.1)fit(activeFitBox||fitBox,false,true);requestRender();};
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const held=new Set();let start=null,moved=false;
  const down=event=>{held.add(event.pointerId);if(held.size>1)moved=true;else{start={x:event.clientX,y:event.clientY};moved=false;}};
  const move=event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)moved=true;};
  const up=event=>{held.delete(event.pointerId);if(!held.size&&start&&!moved){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];if(hit){const data=hit.object.userData,piece=hit.instanceId!==undefined?data.pieces?.[hit.instanceId]:null;onPick?.(data.floorId,piece?.zoneId||data.zoneId);}}if(!held.size)start=null;};
  const cancel=event=>{held.delete(event.pointerId);moved=true;start=null;};
  const lost=event=>{event.preventDefault();onError?.();};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('webglcontextlost',lost);
  resize();update(initial);resize();render();canvas.dataset.renderer='webgl2';onReady?.();
  return {update,reset:()=>reset(false),top:()=>reset(true),rotate,zoom,focusRoom,captureView,restoreView,dispose(){disposed=true;if(frame!==null)cancelAnimationFrame(frame);observer.disconnect();controls.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',lost);disposeGroup(selection);disposeGroup(world);disposeGroup(ground);sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();}};
}

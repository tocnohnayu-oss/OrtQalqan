import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateBuilding } from '../src/domain/calculator.mjs';

const derive=promisify(scrypt),COOKIE='ortqalqan_session',SESSION_MS=12*60*60*1000,INVITE_MS=7*24*60*60*1000;
export const BODY_LIMIT=6_000_000;
const digest=value=>createHash('sha256').update(value).digest('hex');
class ApiError extends Error{constructor(status,code){super(code);this.status=status;this.code=code;}}
const fail=(status,code)=>{throw new ApiError(status,code);};
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\x00-\x1f\x7f]/.test(value);
const validPayload=b=>validateBuilding(b)&&['name','nameKk','address','addressKk','inspector'].every(k=>b[k].length<=(k.startsWith('address')?400:k==='inspector'?100:160))&&b.floors.every(f=>f.name.length<=160&&f.nameKk.length<=160&&f.zones.every(z=>z.name.length<=160&&z.nameKk.length<=160));
const safeUser=user=>({id:user.id,email:user.email,name:user.name});
async function hashPassword(password,salt=randomBytes(16).toString('hex')){
  const hash=await derive(password,salt,64,{N:131072,r:8,p:1,maxmem:160*1024*1024});
  return `scrypt:131072:8:1:${salt}:${hash.toString('hex')}`;
}
async function verifyPassword(password,stored){
  const parts=stored.split(':');
  if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:131072:8:1')return false;
  const candidate=await hashPassword(password,parts[4]);
  return timingSafeEqual(Buffer.from(candidate.split(':')[5],'hex'),Buffer.from(parts[5],'hex'));
}

/** Same-origin JSON API. HTTP transport and deployment configuration live in index.mjs. */
export function createApplication({databasePath='var/ortqalqan.sqlite',origin='http://127.0.0.1:5173',now=()=>Date.now()}={}){
  const canonicalOrigin=new URL(origin).origin,secure=canonicalOrigin.startsWith('https:');
  if(databasePath!==':memory:')mkdirSync(dirname(databasePath),{recursive:true,mode:0o700});
  const db=new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
  const version=db.prepare('PRAGMA user_version').get().user_version;
  if(version===0){db.exec('BEGIN');try{db.exec(readFileSync(new URL('./migrations/001-workspaces.sql',import.meta.url),'utf8'));db.exec('PRAGMA user_version=1; COMMIT');}catch(error){db.exec('ROLLBACK');db.close();throw error;}}
  else if(version!==1){db.close();throw Error('Unsupported database schema');}
  const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}};
  const stamp=()=>new Date(now()).toISOString();
  const event=(workspaceId,actorId,action,label,objectId=null)=>db.prepare('INSERT INTO events(workspace_id,actor_id,action,label,object_id,created_at) VALUES(?,?,?,?,?,?)').run(workspaceId,actorId,action,label,objectId,stamp());
  const membership=(workspaceId,userId)=>{const member=db.prepare('SELECT role FROM memberships WHERE workspace_id=? AND user_id=?').get(workspaceId,userId);if(!member)fail(404,'workspaceMissing');return member;};
  const coordinator=(workspaceId,userId)=>{const member=membership(workspaceId,userId);if(member.role!=='coordinator')fail(403,'coordinatorOnly');return member;};
  const readSession=request=>{
    const raw=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    if(!raw||!/^[A-Za-z0-9_-]{43}$/.test(raw))return null;
    return db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(digest(raw),now())||null;
  };
  const cookie=token=>`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS/1000}${secure?'; Secure':''}`;
  const sessionFor=userId=>{const token=randomBytes(32).toString('base64url');db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now());db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(digest(token),userId,now()+SESSION_MS);return cookie(token);};
  const workspaces=userId=>db.prepare('SELECT w.id,w.name,m.role FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.created_at,w.id').all(userId);
  const rates=new Map();let activeHashes=0;
  const rateLimit=key=>{
    for(const [k,v] of rates)if(v.until<=now())rates.delete(k);
    const old=rates.get(key)||{count:0,until:now()+15*60*1000};
    if(old.count>=10||rates.size>=5000)fail(429,'rateLimited');
    old.count++;rates.set(key,old);
  };
  const expensive=async fn=>{if(activeHashes>=2)fail(429,'rateLimited');activeHashes++;try{return await fn();}finally{activeHashes--;}};
  const objectRow=(workspaceId,id)=>{const row=db.prepare('SELECT * FROM objects WHERE workspace_id=? AND id=?').get(workspaceId,id);if(!row)fail(404,'objectMissing');return row;};
  const objectData=row=>({id:row.id,workspaceId:row.workspace_id,building:JSON.parse(row.building_json),assigneeId:row.assignee_id,phase:row.phase,version:row.version,updatedBy:row.updated_by,updatedAt:row.updated_at});
  const summary=row=>{const b=JSON.parse(row.building_json);return {id:row.id,name:b.name,nameKk:b.nameKk,address:b.address,addressKk:b.addressKk,kind:b.kind||'other',demo:!!b.demo,floors:b.floors.length,assigneeId:row.assignee_id,phase:row.phase,version:row.version,updatedBy:row.updated_by,updatedAt:row.updated_at};};
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
  let dummyHash;
  async function handle(request,{clientAddress='local'}={}){
    try{
      const url=new URL(request.url),path=url.pathname,method=request.method;
      if(!path.startsWith('/api/'))return json({error:'notFound'},404);
      let body={};
      if(!['GET','HEAD'].includes(method)){
        if(request.headers.get('origin')!==canonicalOrigin)fail(403,'originRejected');
        if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'jsonRequired');
        const raw=await request.text();if(Buffer.byteLength(raw)>BODY_LIMIT)fail(413,'tooLarge');
        try{body=JSON.parse(raw);}catch{fail(400,'invalidData');}
        if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'invalidData');
      }
      if(path==='/api/health'&&method==='GET')return json({ready:true,storage:'sqlite'});
      if((path==='/api/auth/register'||path==='/api/auth/login')&&method==='POST'){
        rateLimit('auth:'+clientAddress);
        if(typeof body.email!=='string'||body.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())||typeof body.password!=='string'||body.password.length<12||body.password.length>128)fail(400,'credentialsFormat');
        const email=body.email.trim().toLowerCase();
        rateLimit('email:'+digest(email));
        if(path.endsWith('/register')){
          if(!text(body.name,80)||!text(body.workspace,120))fail(400,'invalidData');
          if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'registrationUnavailable');
          const passwordHash=await expensive(()=>hashPassword(body.password)),id=randomUUID(),workspaceId=randomUUID();
          transaction(()=>{
            if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'registrationUnavailable');
            db.prepare('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)').run(id,email,body.name.trim(),passwordHash,stamp());
            db.prepare('INSERT INTO workspaces(id,name,created_at) VALUES(?,?,?)').run(workspaceId,body.workspace.trim(),stamp());
            db.prepare('INSERT INTO memberships(workspace_id,user_id,role) VALUES(?,?,?)').run(workspaceId,id,'coordinator');
            event(workspaceId,id,'workspaceCreated',body.workspace.trim());
          });
          const user=db.prepare('SELECT * FROM users WHERE id=?').get(id);
          return json({user:safeUser(user),workspaces:workspaces(id)},201,{'Set-Cookie':sessionFor(id)});
        }
        const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
        const valid=await expensive(async()=>{dummyHash||=await hashPassword(randomBytes(32).toString('hex'));return verifyPassword(body.password,user?.password_hash||dummyHash);});
        if(!user||!valid)fail(401,'wrongCredentials');
        return json({user:safeUser(user),workspaces:workspaces(user.id)},200,{'Set-Cookie':sessionFor(user.id)});
      }
      const user=readSession(request);
      if(path==='/api/session'&&method==='GET')return json(user?{user:safeUser(user),workspaces:workspaces(user.id)}:{user:null,workspaces:[]});
      if(!user)fail(401,'signInRequired');
      if(path==='/api/auth/logout'&&method==='POST'){
        const token=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
        if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));
        return json({ok:true},200,{'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`});
      }
      if(path==='/api/invitations/accept'&&method==='POST'){
        if(typeof body.token!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(body.token))fail(400,'inviteInvalid');
        const workspaceId=transaction(()=>{
          const invite=db.prepare('SELECT * FROM invitations WHERE token_hash=? AND revoked=0 AND used_by IS NULL AND expires_at>?').get(digest(body.token),now());
          if(!invite)fail(410,'inviteInvalid');
          if(db.prepare('SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=?').get(invite.workspace_id,user.id))fail(409,'alreadyMember');
          if(db.prepare('SELECT count(*) AS n FROM memberships WHERE workspace_id=?').get(invite.workspace_id).n>=100)fail(409,'teamLimit');
          db.prepare('INSERT INTO memberships(workspace_id,user_id,role) VALUES(?,?,?)').run(invite.workspace_id,user.id,'inspector');
          db.prepare('UPDATE invitations SET used_by=? WHERE id=?').run(user.id,invite.id);
          event(invite.workspace_id,user.id,'memberJoined',user.name);return invite.workspace_id;
        });return json({workspaceId,workspaces:workspaces(user.id)});
      }
      const route=path.match(/^\/api\/workspaces\/([^/]+)(?:\/(objects|invitations)(?:\/([^/]+))?)?$/);
      if(!route)fail(404,'notFound');
      const [,workspaceId,resource,id]=route;
      membership(workspaceId,user.id);
      if(!resource&&method==='GET'){
        const workspace=db.prepare('SELECT id,name FROM workspaces WHERE id=?').get(workspaceId);
        const members=db.prepare('SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=? ORDER BY m.role,u.name').all(workspaceId);
        const objects=db.prepare('SELECT * FROM objects WHERE workspace_id=? ORDER BY updated_at DESC,id').all(workspaceId).map(summary);
        const events=db.prepare('SELECT e.id,e.action,e.label,e.object_id AS objectId,e.created_at AS createdAt,u.name AS actor FROM events e JOIN users u ON u.id=e.actor_id WHERE e.workspace_id=? ORDER BY e.id DESC LIMIT 50').all(workspaceId);
        const invitations=membership(workspaceId,user.id).role==='coordinator'?db.prepare('SELECT id,expires_at AS expiresAt FROM invitations WHERE workspace_id=? AND used_by IS NULL AND revoked=0 AND expires_at>? ORDER BY expires_at DESC').all(workspaceId,now()):[];
        return json({workspace,members,objects,events,invitations});
      }
      if(resource==='invitations'){
        coordinator(workspaceId,user.id);
        if(method==='POST'&&!id){
          if(db.prepare('SELECT count(*) AS n FROM invitations WHERE workspace_id=? AND used_by IS NULL AND revoked=0 AND expires_at>?').get(workspaceId,now()).n>=10)fail(409,'inviteLimit');
          const token=randomBytes(24).toString('base64url'),inviteId=randomUUID(),expiresAt=now()+INVITE_MS;
          transaction(()=>{db.prepare('INSERT INTO invitations(id,workspace_id,token_hash,created_by,expires_at) VALUES(?,?,?,?,?)').run(inviteId,workspaceId,digest(token),user.id,expiresAt);event(workspaceId,user.id,'inviteCreated','');});
          return json({id:inviteId,token,expiresAt},201);
        }
        if(method==='DELETE'&&id){
          const changed=db.prepare('UPDATE invitations SET revoked=1 WHERE workspace_id=? AND id=? AND used_by IS NULL AND revoked=0').run(workspaceId,id);
          if(!changed.changes)fail(404,'inviteInvalid');event(workspaceId,user.id,'inviteRevoked','');return json({ok:true});
        }
      }
      if(resource==='objects'){
        if(method==='POST'&&!id){
          if(!validPayload(body.building))fail(400,'invalidBuilding');
          if(db.prepare('SELECT count(*) AS n FROM objects WHERE workspace_id=?').get(workspaceId).n>=200)fail(409,'objectLimit');
          const objectId=randomUUID();
          transaction(()=>{db.prepare('INSERT INTO objects(id,workspace_id,building_json,assignee_id,updated_by,updated_at,created_at) VALUES(?,?,?,?,?,?,?)').run(objectId,workspaceId,JSON.stringify(body.building),user.id,user.id,stamp(),stamp());event(workspaceId,user.id,'objectCreated',body.building.name,objectId);});
          return json(objectData(objectRow(workspaceId,objectId)),201);
        }
        if(method==='GET'&&id)return json(objectData(objectRow(workspaceId,id)));
        if((method==='PUT'||method==='PATCH')&&id){
          if(!Number.isSafeInteger(body.version)||body.version<1)fail(400,'invalidData');
          if(method==='PUT'&&!validPayload(body.building))fail(400,'invalidBuilding');
          if(method==='PATCH'){
            coordinator(workspaceId,user.id);
            if(!['draft','inspection','review','archived'].includes(body.phase))fail(400,'invalidData');
            if(body.assigneeId!==null&&(typeof body.assigneeId!=='string'||!db.prepare('SELECT 1 FROM memberships WHERE workspace_id=? AND user_id=?').get(workspaceId,body.assigneeId)))fail(400,'assigneeMissing');
          }
          transaction(()=>{
            const current=objectRow(workspaceId,id);if(current.version!==body.version)fail(409,'versionConflict');
            if(method==='PUT')db.prepare('UPDATE objects SET building_json=?,version=version+1,updated_by=?,updated_at=? WHERE workspace_id=? AND id=? AND version=?').run(JSON.stringify(body.building),user.id,stamp(),workspaceId,id,body.version);
            else db.prepare('UPDATE objects SET assignee_id=?,phase=?,version=version+1,updated_by=?,updated_at=? WHERE workspace_id=? AND id=? AND version=?').run(body.assigneeId,body.phase,user.id,stamp(),workspaceId,id,body.version);
            event(workspaceId,user.id,method==='PUT'?'objectSaved':'assignmentChanged',method==='PUT'?body.building.name:JSON.parse(current.building_json).name,id);
          });return json(objectData(objectRow(workspaceId,id)));
        }
      }
      fail(404,'notFound');
    }catch(error){
      if(error instanceof ApiError)return json({error:error.code},error.status);
      // Keep credentials, object contents and SQL details out of response/log output.
      return json({error:'serverError'},500);
    }
  }
  return {handle,close:()=>db.close()};
}

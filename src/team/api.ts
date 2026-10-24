import type { Building, BuildingKind } from '../domain/types';
export type Role='coordinator'|'inspector';
export type Phase='draft'|'inspection'|'review'|'archived';
export type User={id:string;name:string;email:string};
export type Workspace={id:string;name:string;role:Role};
export type Session={user:User|null;workspaces:Workspace[]};
export type Member=User&{role:Role};
export type RemoteObject={id:string;workspaceId:string;building:Building;assigneeId:string|null;phase:Phase;version:number;updatedBy:string;updatedAt:string};
export type ObjectSummary={id:string;name:string;nameKk:string;address:string;addressKk:string;kind:BuildingKind;demo:boolean;floors:number;assigneeId:string|null;phase:Phase;version:number;updatedBy:string;updatedAt:string};
export type TeamBoard={workspace:{id:string;name:string};members:Member[];objects:ObjectSummary[];events:{id:number;action:string;label:string;objectId:string|null;createdAt:string;actor:string}[];invitations:{id:string;expiresAt:number}[]};
export class ApiError extends Error {code:string;status:number;constructor(code:string,status=0){super(code);this.code=code;this.status=status;}}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
  let response:Response;
  try{response=await fetch('/api'+path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(body||{})});}catch{throw new ApiError('serverUnavailable');}
  if(!response.headers.get('content-type')?.includes('application/json'))throw new ApiError('serverUnavailable');
  const result=await response.json().catch(()=>{throw new ApiError('serverUnavailable');});
  if(!response.ok)throw new ApiError(result.error||'serverError',response.status);
  return result as T;
}
export const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase();

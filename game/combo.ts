import type {Actor} from './simulation';
export function comboReadout(a:Pick<Actor,'move'|'chainQueued'|'grounded'|'stun'|'out'|'respawn'>){
 if(!a.move?.chainStep||!a.grounded||a.stun>0||a.out||a.respawn)return null;
 const queued=a.chainQueued;
 return {step:a.move.chainStep,name:a.move.name,
  hint:queued?(queued==='l2'||queued==='l3'?'LIGHT QUEUED':'HEAVY QUEUED'):
   a.move.chain?(a.move.chain.heavyBranch?'LIGHT OR HEAVY':'TAP LIGHT AGAIN'):'FINISHER'};
}

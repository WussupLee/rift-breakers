import type {FighterId,MoveId,MoveDefinition} from './data';

/** Original move data. Each move has a dedicated motion-atlas pose pair; geometry drives matching VFX. */
export function tuneMoves(id:FighterId,m:Record<MoveId,MoveDefinition>){
 const patch=(key:MoveId,p:Partial<MoveDefinition>)=>Object.assign(m[key],p);
 const box=(x:number,y:number,radius:number,endX=x,endY=y)=>({x,y,radius,endX,endY});
 const link=(next:MoveId,cancelRecovery:number,heavyBranch=false)=>({next,cancelRecovery,heavyBranch});
 const follow=(key:'l2'|'l3',p:Partial<MoveDefinition>)=>{
  m[key]={...m.nl,id:key,animation:key==='l2'?'attack2':'attack3',chain:undefined,
   chainStep:key==='l2'?2:3,projectile:undefined,charge:false,...p};
 };
 if(id==='kairo'){
  patch('nl',{name:'Quick jab',startup:5,active:4,recovery:15,damage:4,base:2.2,scaling:.018,angle:-12,hitbox:box(23,-32,20,47),chainStep:1,chain:link('l2',2)});
  patch('sl',{name:'Step-in palm',startup:6,active:4,recovery:16,damage:5,base:2.5,scaling:.02,angle:-15,impulse:5,hitbox:box(26,-32,22,56),chainStep:1,chain:link('l2',2)});
  follow('l2',{name:'Cross punch',startup:4,active:4,recovery:15,damage:4,base:2.6,scaling:.021,angle:-18,impulse:3,hitbox:box(27,-34,23,65),chain:link('l3',2,true)});
  follow('l3',{name:'Rift uppercut',startup:5,active:5,recovery:21,damage:8,base:5.2,scaling:.052,angle:-68,impulse:3,hitbox:box(26,-34,26,59,-68)});
  patch('dl',{name:'Ankle sweep',startup:6,active:5,recovery:15,damage:6,base:3.2,angle:-70,hitbox:box(21,-10,19,63)});
  patch('nh',{name:'Skybreaker',animation:'attack3',startup:12,active:7,recovery:26,damage:16,base:7.3,scaling:.09,angle:-87,hitbox:box(15,-40,29,23,-103),lift:-6});
  patch('sh',{name:'Scarf breaker',animation:'attack2',startup:16,active:7,recovery:29,damage:18,base:7.8,scaling:.094,angle:-23,impulse:10,hitbox:box(26,-34,28,88)});
  patch('dh',{name:'Orbit breaker',animation:'attack3',startup:18,active:9,recovery:30,damage:16,base:7,scaling:.08,angle:-44,hitbox:box(48,-24,28,64)});
  patch('na',{name:'Orbit kick',startup:6,active:6,recovery:16,damage:6,base:3.5,scaling:.043,angle:-36,hitbox:box(27,-30,23,35,-25)});
  patch('sa',{name:'Flying punch',startup:5,active:4,recovery:18,damage:8,base:4.1,scaling:.055,angle:-20,impulse:3,hitbox:box(26,-34,22,76,-32)});
  patch('da',{name:'Heel dive',startup:7,active:5,recovery:19,damage:9,base:4.4,scaling:.052,angle:72,hitbox:box(22,-8,22,43,28)});
  patch('rec',{lift:-16.2,hitbox:box(10,-45,29,22,-92)});
  patch('gp',{damage:19,base:8,angle:78,hitbox:box(8,4,29,18,46)});
 }else if(id==='regent'){
  patch('nl',{name:'Hilt check',startup:8,active:5,recovery:19,damage:6,base:2.5,scaling:.018,angle:-12,hitbox:box(24,-37,25,54),chainStep:1,chain:link('l2',4)});
  patch('sl',{name:'Royal sweep',startup:9,active:6,recovery:20,damage:7,base:2.8,scaling:.02,angle:-16,impulse:3,hitbox:box(28,-32,27,81),chainStep:1,chain:link('l2',4)});
  follow('l2',{name:'Backhand cleave',startup:6,active:6,recovery:20,damage:5,base:2.7,scaling:.022,angle:-18,impulse:3,hitbox:box(25,-34,30,90),chain:link('l3',4,true)});
  follow('l3',{name:'Crown sentence',startup:8,active:7,recovery:28,damage:11,base:6.5,scaling:.067,angle:-32,impulse:4,hitbox:box(31,-35,32,105)});
  patch('dl',{startup:9,damage:8,angle:-76,hitbox:box(24,-10,25,87)});
  patch('nh',{name:'Execution arc',animation:'attack1',startup:22,active:9,recovery:35,damage:23,base:8.6,scaling:.107,angle:-78,hitbox:box(22,-44,35,62,-103)});
  patch('sh',{name:'Iron decree',animation:'attack2',startup:23,active:9,recovery:36,damage:24,base:9,scaling:.106,angle:-24,impulse:7,armor:true,hitbox:box(30,-32,35,111)});
  patch('dh',{name:'Throne quake',animation:'attack3',startup:25,active:10,recovery:38,damage:22,base:8.3,scaling:.093,angle:-53,hitbox:box(63,-10,32,86)});
  patch('na',{name:'Royal orbit',startup:10,active:8,recovery:24,damage:10,base:4.4,scaling:.061,angle:-40,hitbox:box(46,-33,30,65,-25)});
  patch('sa',{name:'Greatsword arc',startup:11,active:7,recovery:27,damage:13,base:5.8,scaling:.072,angle:-28,impulse:2,hitbox:box(32,-38,31,112,-25)});
  patch('da',{name:'Blade plunge',startup:12,active:7,recovery:28,damage:14,base:5.6,scaling:.07,angle:83,hitbox:box(7,-7,28,12,52)});
  patch('rec',{lift:-14.8,damage:20,hitbox:box(6,-56,35,10,-108)});
  patch('gp',{startup:20,damage:25,base:9.5,angle:86,hitbox:box(5,8,37,12,51)});
 }else if(id==='vexa'){
  patch('nl',{name:'Haft snap',startup:4,active:3,recovery:12,damage:3,base:1.9,scaling:.016,angle:-8,hitbox:box(24,-29,18,66),chainStep:1,chain:link('l2',1)});
  patch('sl',{name:'Dash thrust',startup:5,active:4,recovery:13,damage:4,base:2.1,scaling:.018,angle:-12,impulse:7,hitbox:box(28,-30,19,86),chainStep:1,chain:link('l2',1)});
  follow('l2',{name:'Pursuit thrust',startup:3,active:4,recovery:12,damage:3,base:2,scaling:.018,angle:-14,impulse:4,hitbox:box(28,-30,21,96),chain:link('l3',1,true)});
  follow('l3',{name:'Thorn hook',startup:4,active:5,recovery:18,damage:7,base:4.8,scaling:.049,angle:-55,impulse:5,hitbox:box(27,-28,24,86,-62)});
  patch('dl',{name:'Sliding sweep',startup:4,recovery:13,damage:5,angle:-76,impulse:4,hitbox:box(28,-8,18,77)});
  patch('nh',{name:'Pole-vault rise',animation:'attack3',startup:11,active:6,recovery:23,damage:14,base:6.4,scaling:.073,angle:-83,lift:-8,hitbox:box(16,-40,25,35,-98)});
  patch('sh',{name:'Vault cleave',animation:'attack2',startup:14,active:6,recovery:25,damage:16,base:7,scaling:.081,angle:-37,impulse:11,lift:-4,hitbox:box(33,-28,24,106,-47)});
  patch('dh',{name:'Low cyclone',animation:'attack1',startup:12,active:8,recovery:23,damage:13,base:6,scaling:.071,angle:-66,impulse:2,hitbox:box(56,-9,22,81)});
  patch('na',{name:'Pole orbit',startup:4,active:6,recovery:13,damage:5,base:3,scaling:.034,angle:-32,hitbox:box(39,-28,19,64,-22)});
  patch('sa',{name:'Needle flight',startup:4,active:3,recovery:14,damage:6,base:3.3,scaling:.042,angle:-18,impulse:2,hitbox:box(29,-30,17,101,-30)});
  patch('da',{name:'Downward hook',startup:6,active:5,recovery:17,damage:7,base:3.8,scaling:.046,angle:65,hitbox:box(28,-10,21,72,29)});
  patch('rec',{lift:-17.4,startup:12,damage:14,hitbox:box(18,-53,25,29,-108)});
  patch('gp',{startup:13,damage:16,base:7,angle:70,hitbox:box(25,4,25,50,48)});
 }else{
  patch('nl',{name:'Spark pulse',startup:7,active:5,recovery:17,damage:4,base:2.1,scaling:.016,angle:-12,hitbox:box(29,-35,25,59),chainStep:1,chain:link('l2',3)});
  follow('l2',{name:'Rift lance',startup:5,active:5,recovery:18,damage:4,base:2.5,scaling:.018,angle:-19,hitbox:box(31,-36,27,93),chain:link('l3',3,true)});
  follow('l3',{name:'Null expulsion',startup:7,active:7,recovery:25,damage:9,base:6.2,scaling:.06,angle:-28,hitbox:box(37,-35,35,98)});
  patch('sl',{name:'Staff bolt',startup:9,active:4,recovery:20,damage:7,impulse:0,projectileStats:{speed:11,radius:11,life:65}});
  patch('dl',{name:'Floor sigil',startup:9,recovery:22,damage:7,angle:-79,projectileStats:{arm:12,radius:29,life:100,offsetX:95}});
  patch('nh',{name:'Rift crystal',animation:'attack1',startup:15,active:6,recovery:27,damage:16,base:7.8,scaling:.089,angle:-88,projectile:'crystal',projectileStats:{speed:0,vy:-9,radius:22,life:26,offsetX:40,offsetY:-12}});
  patch('sh',{name:'Rift beam',animation:'attack2',startup:21,active:7,recovery:33,damage:19,base:8,scaling:.091,angle:-16,impulse:0,projectileStats:{speed:18,radius:16,life:50}});
  patch('dh',{name:'Event horizon',animation:'attack3',startup:19,active:6,recovery:32,damage:20,base:8.7,scaling:.093,angle:-75,projectileStats:{arm:38,radius:43,life:180,offsetX:125}});
  patch('na',{name:'Satellite pulse',startup:8,active:8,recovery:19,damage:7,base:3.8,scaling:.046,angle:-48,hitbox:box(30,-36,30,38,-28)});
  patch('sa',{name:'Forward burst',startup:9,active:4,recovery:23,damage:8,base:4.1,scaling:.052,angle:-21,projectile:'bolt',projectileStats:{speed:9,vy:0,radius:14,life:46,offsetX:39,offsetY:-35}});
  patch('da',{name:'Falling shard',startup:10,active:5,recovery:24,damage:9,base:4.3,scaling:.056,angle:71,projectile:'shard',projectileStats:{speed:4,vy:9,radius:13,life:44,offsetX:25,offsetY:4}});
  patch('rec',{lift:-12.8,startup:15,damage:13,hitbox:box(5,-56,31,5,-93)});
  patch('gp',{startup:18,damage:20,base:8.5,angle:84,hitbox:box(0,9,37,0,55)});
 }
 return m;
}

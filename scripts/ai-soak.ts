import {Simulation} from '../game/simulation';
import {defaultConfig,FIGHTERS,type Difficulty} from '../game/data';
const results=[];
for(const [a,b] of [['medium','easy'],['hard','medium']] as Difficulty[][]){let wins=0,losses=0,draws=0,totalTicks=0;for(let seed=1;seed<=24;seed++){
 const id=FIGHTERS[(seed-1)%4].id;
 const s=new Simulation({...defaultConfig,mode:'timed',seconds:120,seed,items:'off',slots:[{fighter:id,difficulty:a,team:0},{fighter:id,difficulty:b,team:1}]});s.countdown=0;
 for(let tick=0;tick<18000&&!s.ended;tick++){s.step(s.ai(s.actors[0]));if(s.actors.some(p=>![p.x,p.y,p.damage].every(Number.isFinite)))throw new Error('Non-finite physics');}
 totalTicks+=s.tick;if(!s.ended)draws++;else if(s.winners.includes(0))wins++;else losses++;
 }results.push({pair:a+' vs '+b,wins,losses,draws,averageSeconds:Math.round(totalTicks/24/60)});
}
console.log(JSON.stringify(results,null,2));

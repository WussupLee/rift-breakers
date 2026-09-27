export type FeelMode='classic'|'relaxed';
export type FeelPreference='auto'|FeelMode;
export const FEEL={
 classic:{speed:1,gravity:1,fallSpeed:13,airControl:1,buffer:6,coyote:5},
 relaxed:{speed:.85,gravity:.9,fallSpeed:11.5,airControl:1.1,buffer:9,coyote:8},
} as const;
export function resolveFeel(preference:FeelPreference,touch:boolean):FeelMode{
 return preference==='relaxed'||preference==='auto'&&touch?'relaxed':'classic';
}
export const FIXED_STEP_MS=1000/60;
export function scaledDelta(delta:number,mode:FeelMode){return Math.max(0,Math.min(delta,100))*FEEL[mode].speed;}

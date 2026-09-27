import type * as Phaser from 'phaser';
import {STAGE,asset} from './data';

/** Purely visual scenery. Never registers bodies or modifies simulation state. */
export class SpaceStation {
  readonly background:Phaser.GameObjects.Image;
  readonly platforms:Phaser.GameObjects.Image[];
  readonly ships:Phaser.GameObjects.Image[];
  readonly atmosphere:Phaser.GameObjects.Graphics;
  readonly lights:Phaser.GameObjects.Graphics;
  readonly motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  static preload(scene:Phaser.Scene){
    for(const key of ['background','platform','shuttle'])scene.load.image(`station-${key}`,asset(`station/${key}.png`));
  }
  constructor(readonly scene:Phaser.Scene){
    this.background=scene.add.image(500,470,'station-background').setDepth(-40);
    this.atmosphere=scene.add.graphics().setDepth(-25);
    this.ships=[0,1,2].map(()=>scene.add.image(0,0,'station-shuttle').setDepth(-24).setVisible(false));
    this.platforms=STAGE.platforms.map((p,i)=>scene.add.image(p.x,p.y,'station-platform').setOrigin(0,0).setDisplaySize(p.width,i?34:96).setDepth(-2));
    this.lights=scene.add.graphics().setDepth(-1);
  }
  draw(tick:number,zoom:number,width:number,height:number,centerX=500,centerY=470){
    // Screen-cover framing keeps the moons visible in portrait and landscape.
    // Inverse zoom gives the distant scenery less camera motion than the deck.
    const size=Math.max(width,height)/zoom;
    const left=centerX-size/2,top=centerY-height/(2*zoom);
    this.background.setPosition(centerX,top+size/2).setDisplaySize(size,size);
    const g=this.atmosphere;g.clear();
    const time=this.motion.matches?0:tick/60;
    this.ships.forEach((ship,i)=>{
      const phase=(time+i*7)%24;
      const visible=!this.motion.matches&&phase<8;
      ship.setVisible(visible);if(!visible)return;
      const progress=phase/8;
      const u=[.18,.83,.69][i]+(i===1?-.025:.02)*progress*progress;
      const v=.91-.91*progress*progress;
      const x=left+u*size,y=top+v*size;
      const h=size*(i===2?.022:.033);
      ship.setPosition(Math.round(x),Math.round(y)).setDisplaySize(h*ship.width/ship.height,h).setAlpha(.62*(1-Math.max(0,(progress-.85)/.15)));
      const trail=h*(.35+progress*2.5),pixel=Math.max(2,size/480);
      g.fillStyle(0x5eeedb,.12);g.fillRect(x-pixel*2,y+h*.38,pixel*4,trail);
      g.fillStyle(0xb6ffef,.55);g.fillRect(x-pixel/2,y+h*.4,pixel,trail*.6);
    });
    // A single occasional comet: fixed object count, no emitter accumulation.
    const phase=(time+4)%19;
    if(!this.motion.matches&&phase<2.4){
      const p=phase/2.4,x=left+size*(.1+p*.9),y=top+size*(.12+p*.3),unit=size/480;
      for(let n=0;n<15;n++){g.fillStyle(n<3?0xe0f5ec:0x75b7c9,(1-n/15)*.5);g.fillRect(Math.round(x-n*unit*3),Math.round(y-n*unit),unit*2,unit*2);}
    }
    this.lights.clear();
    for(const [i,p] of STAGE.platforms.entries()){
      // Exact collision-top cue, independent of transparent sprite decoration.
      this.lights.fillStyle(i?0xff85c8:0x89fff0,.9);this.lights.fillRect(p.x,p.y,p.width,2);
      const pulse=this.motion.matches?.4:.35+Math.sin(time*1.8+i)*.08;
      this.lights.fillStyle(0x66f8e4,pulse);
      for(const offset of [.18,.82])this.lights.fillRect(p.x+p.width*offset-6,p.y+(i?23:68),12,i?3:5);
    }
  }
}

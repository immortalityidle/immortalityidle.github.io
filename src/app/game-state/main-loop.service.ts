
import { Injectable,Injector } from '@angular/core';
import { Subject } from 'rxjs';
//import { threadId } from 'worker_threads';
import { CharacterService } from './character.service';

const TICK_INTERVAL_MS = 25;
const LONG_TICK_INTERVAL_MS = 500;

export interface MainLoopProperties {
  unlockFastSpeed: boolean,
  unlockFasterSpeed: boolean,
  unlockFastestSpeed: boolean,
  unlockAgeSpeed: boolean,
  unlockPlaytimeSpeed: boolean,
  lastTime: number;
  tickDivider: number;
  offlineDivider: number;
  pause: boolean;
  bankedTicks: number;
  totalTicks: number;
  useBankedTicks: boolean
}

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  /**
   * Sends true on new day
   */
  tickSubject = new Subject<boolean>();
  longTickSubject = new Subject<boolean>();
  pause = true;
  tickDivider = 10;
  tickCount = 0;
  totalTicks = 0;
  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;
  topDivider = 10;
  unlockAgeSpeed = false;
  unlockPlaytimeSpeed = false;
  lastTime: number = new Date().getTime();
  bankedTicks = 0;
  offlineDivider = 10;
  characterService?: CharacterService;
  useBankedTicks = true;

  constructor(
    private injector: Injector) {
  }

  getProperties(): MainLoopProperties {
    return {
      unlockFastSpeed: this.unlockFastSpeed,
      unlockFasterSpeed: this.unlockFasterSpeed,
      unlockFastestSpeed: this.unlockFastestSpeed,
      unlockAgeSpeed: this.unlockAgeSpeed,
      unlockPlaytimeSpeed: this.unlockPlaytimeSpeed,
      offlineDivider: this.offlineDivider,
      lastTime: this.lastTime,
      tickDivider: this.tickDivider,
      pause: this.pause,
      bankedTicks: this.bankedTicks,
      totalTicks: this.totalTicks,
      useBankedTicks: this.useBankedTicks
    }
  }

  setProperties(properties: MainLoopProperties) {
    this.unlockFastSpeed = properties.unlockFastSpeed;
    this.unlockFasterSpeed = properties.unlockFasterSpeed;
    this.unlockFastestSpeed = properties.unlockFastestSpeed;
    this.topDivider = 10; // For earning bankedticks based on top divider. 
    if (this.unlockFastestSpeed) {
      this.topDivider = 1;
    } else if (this.unlockFasterSpeed) {
      this.topDivider = 2;
    } else if (this.unlockFastSpeed) {
      this.topDivider = 5;
    }
    this.unlockAgeSpeed = properties.unlockAgeSpeed;
    this.unlockPlaytimeSpeed = properties.unlockPlaytimeSpeed;
    this.tickDivider = properties.tickDivider;
    this.offlineDivider = properties.offlineDivider || 10;
    this.pause = properties.pause;
    this.lastTime = properties.lastTime;
    const newTime = new Date().getTime();
    if (newTime - this.lastTime > 168*60*60*1000) {
      // to diminish effects of forgetting about the game for a year and coming back with basically infinite ticks
      this.bankedTicks = properties.bankedTicks + (3*168*60*60*1000 + newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider * 4);
    } else {
      this.bankedTicks = properties.bankedTicks + (newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider);
    }
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks || 0;
    this.useBankedTicks = properties.useBankedTicks ?? true;
  }

  start() {
    if (!this.characterService){
      this.characterService = this.injector.get(CharacterService);
    }

    window.setInterval(()=> {
      this.longTickSubject.next(true);
    }, LONG_TICK_INTERVAL_MS);

    window.setInterval(()=> {
      const newTime = new Date().getTime();
      const timeDiff = newTime - this.lastTime;
      this.lastTime = newTime;
      // this should be around 1, but may vary based on browser throttling
      let ticksPassed = timeDiff / TICK_INTERVAL_MS; 
      if (this.pause) {
        this.bankedTicks += ticksPassed / this.offlineDivider; // offlineDivider currently either 10 or 2.
      } else {
        if (this.bankedTicks > 0 && this.useBankedTicks){
          //using banked ticks makes time happen 10 times faster
          ticksPassed *= 11; // Include the normal tick
          this.bankedTicks -= timeDiff / TICK_INTERVAL_MS * 10 * (this.topDivider / this.tickDivider);
        }

        ticksPassed *= this.getTPS(this.tickDivider) / 1000 * TICK_INTERVAL_MS;
        this.tickCount += ticksPassed;
        if (this.tickCount > 36500) {
          //emergency lag prevention; this should never activate normally
          this.tickCount = 36500;
        }
        let tickTime = new Date().getTime();
        while (!this.pause && this.tickCount >= 1 && tickTime < TICK_INTERVAL_MS + newTime) {
          this.tick();
          this.tickCount--;
          tickTime = new Date().getTime();
        }
      }
    }, TICK_INTERVAL_MS);
  }

  getTPS(div:number) {
    let ticksPassed = 1000/TICK_INTERVAL_MS;
    if (this.characterService && this.unlockAgeSpeed) {
      // 73000 is 200 years. reaches 2x at 600 years, 3x at 1600, 4x at 3000. Caps at 12600
      ticksPassed *= Math.min(8,Math.sqrt(1+this.characterService.characterState.age/73000));
    }
    if (this.unlockPlaytimeSpeed) {
      ticksPassed *= Math.pow(1+this.totalTicks/(2000*365),0.3);
    }
    ticksPassed /= div;
    // make non-max speeds a bit more potent at high speeds
    const TICKSPEED_CAP = 40;
    if (div > 1 && ticksPassed > TICKSPEED_CAP) {
      if (div >= 10) {
        ticksPassed = TICKSPEED_CAP;
      } else {
        ticksPassed = TICKSPEED_CAP+(ticksPassed-TICKSPEED_CAP)/div;
      }
    }
    return ticksPassed;
  }

  tick(){
    this.totalTicks++;
    this.tickSubject.next(true);
  }
}

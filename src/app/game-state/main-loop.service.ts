
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
    this.unlockAgeSpeed = properties.unlockAgeSpeed;
    this.unlockPlaytimeSpeed = properties.unlockPlaytimeSpeed;
    this.tickDivider = properties.tickDivider;
    this.pause = properties.pause;
    this.lastTime = properties.lastTime;
    const newTime = new Date().getTime();
    this.bankedTicks = properties.bankedTicks + (newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider);
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks || 0;
    if (properties.useBankedTicks === undefined){
      this.useBankedTicks = true;
    } else {
      this.useBankedTicks = properties.useBankedTicks;
    }
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
      //this should be around 1, but may vary based on browser throttling
      let ticksPassed = timeDiff / TICK_INTERVAL_MS; 
      if (this.pause) {
        this.bankedTicks += ticksPassed/this.offlineDivider;
      } else {
        /*if (this.characterService) {
          // should never be null but this keeps the compiler happy
          if (this.characterService.characterState.lifespan > 36500){
            // add one extra tick at 100 years lifespan
            repeatTimes++;
          }
          if (this.characterService.characterState.lifespan > 365000){
            // and an extra tick at 1000 years lifespan
            repeatTimes++;
          }
          // and one extra for every 5000 years you've ever lived, up to 100 repeats
          repeatTimes += Math.min(Math.floor(this.totalTicks / 1825000), 100);
        }*/

        if (this.characterService && this.unlockAgeSpeed) {
          ticksPassed *= Math.sqrt(1+this.characterService.characterState.age/73000);
        }
        if (this.unlockPlaytimeSpeed) {
          ticksPassed *= Math.pow(1+this.totalTicks/365000,0.3);
        }

        ticksPassed /= this.tickDivider;
        if (this.tickDivider > 1 && ticksPassed > 1) {
          //make non-max speeds a bit more potent at high speeds
          if (this.tickDivider == 10) {
            ticksPassed = 1;
          } else {
            ticksPassed = Math.max(1,0.66+ticksPassed/this.tickDivider);
          }
        }
        if (this.bankedTicks > 0 && this.useBankedTicks){
          //using banked ticks makes time happen 10 times faster
          ticksPassed *= 10;
          this.bankedTicks -= timeDiff / TICK_INTERVAL_MS * 10;
        }

        this.tickCount += ticksPassed;
        if (this.tickCount > 36500) {
          //emergency lag prevention; this should never activate normally
          this.tickCount = 36500;
        }
        while (!this.pause && this.tickCount > 0) {
          this.tick();
          this.tickCount--;
        }
      }
    }, TICK_INTERVAL_MS);
  }

  tick(){
    this.totalTicks++;
    this.tickSubject.next(true);
  }
}

import { Injectable,Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { CharacterService } from './character.service';

const TICK_INTERVAL_MS = 25;
const LONG_TICK_INTERVAL_MS = 500;

export interface MainLoopProperties {
  unlockFastSpeed: boolean,
  unlockFasterSpeed: boolean,
  unlockFastestSpeed: boolean,
  lastTime: number;
  tickDivider: number;
  pause: boolean;
  bankedTicks: number;
  totalTicks: number;
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
  unlockFastSpeed: boolean = false;
  unlockFasterSpeed: boolean = false;
  unlockFastestSpeed: boolean = false;
  lastTime: number = new Date().getTime();
  bankedTicks: number = 0;
  offlineDivider: number = 10;
  characterService?: CharacterService;
  useSavedTicks: boolean = true;

  constructor(
    private injector: Injector) {
  }

  getProperties(): MainLoopProperties {
    return {
      unlockFastSpeed: this.unlockFastSpeed,
      unlockFasterSpeed: this.unlockFasterSpeed,
      unlockFastestSpeed: this.unlockFastestSpeed,
      lastTime: this.lastTime,
      tickDivider: this.tickDivider,
      pause: this.pause,
      bankedTicks: this.bankedTicks,
      totalTicks: this.totalTicks
    }
  }

  setProperties(properties: MainLoopProperties) {
    this.unlockFastSpeed = properties.unlockFastSpeed;
    this.unlockFasterSpeed = properties.unlockFasterSpeed;
    this.unlockFastestSpeed = properties.unlockFastestSpeed;
    this.tickDivider = properties.tickDivider;
    this.pause = properties.pause;
    this.lastTime = properties.lastTime;
    let newTime = new Date().getTime();
    this.bankedTicks = properties.bankedTicks + Math.floor((newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider));
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks || 0;
  }

  start() {
    if (!this.characterService){
      this.characterService = this.injector.get(CharacterService);
    }

    window.setInterval(()=> {
      this.longTickSubject.next(true);
    }, LONG_TICK_INTERVAL_MS);

    window.setInterval(()=> {
      let newTime = new Date().getTime();
      let timeDiff = newTime - this.lastTime;
      this.lastTime = newTime;
      // do multiple tick events if chrome has been throttling the interval (cause the tab isn't active)
      let repeatTimes = Math.floor(timeDiff / TICK_INTERVAL_MS) || 1;
      if (this.pause) {
        this.bankedTicks++;
      } else {
        if (this.bankedTicks > 0 && this.useSavedTicks){
          repeatTimes += 10 / this.tickDivider;
          this.bankedTicks -= 10 / this.tickDivider;
        }
        if (this.characterService && this.characterService.characterState.lifespan > 36500){
          repeatTimes++;
        }
        if (this.characterService && this.characterService.characterState.lifespan > 365000){
          repeatTimes++;
        }
        for (let i = 0; i < repeatTimes; i++){
          this.tickCount++;
          if (this.tickCount >= this.tickDivider){
            this.tickCount = 0;
            this.tick();
          }
        }
      }
    }, TICK_INTERVAL_MS);
  }

  tick(){
    this.totalTicks++;
    this.tickSubject.next(true);
  }
}

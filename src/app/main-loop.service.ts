import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 25;

export interface MainLoopProperties {
  unlockFastSpeed: boolean,
  unlockFasterSpeed: boolean,
  unlockFastestSpeed: boolean,
  lastTime: number;
  tickDivider: number;
  pause: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  /**
   * Sends true on new day
   */
  tickSubject = new Subject<boolean>();
  pause = true;
  tickDivider = 10;

  tickCount = 0;

  unlockFastSpeed: boolean = false;
  unlockFasterSpeed: boolean = false;
  unlockFastestSpeed: boolean = false;
  lastTime: number = new Date().getTime();
  bankedTicks: number = 0;

  constructor() {
  }

  getProperties(): MainLoopProperties {
    return {
      unlockFastSpeed: this.unlockFastSpeed,
      unlockFasterSpeed: this.unlockFasterSpeed,
      unlockFastestSpeed: this.unlockFastestSpeed,
      lastTime: this.lastTime,
      tickDivider: this.tickDivider,
      pause: this.pause
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
    this.bankedTicks = Math.floor((newTime - this.lastTime) / TICK_INTERVAL_MS);
    this.lastTime = newTime;
  }

  start() {
    window.setInterval(()=> {
      let newTime = new Date().getTime();
      let timeDiff = newTime - this.lastTime;
      this.lastTime = newTime;
      // do multiple tick events if chrome has been throttling the interval (cause the tab isn't active)
      let repeatTimes = Math.floor(timeDiff / TICK_INTERVAL_MS) || 1;
      if (!this.pause) {
        if (this.bankedTicks > 0){
          repeatTimes += 1;
          this.bankedTicks -= 1;
        }
        for (let i = 0; i < repeatTimes; i++){
          this.tickCount++;
          if (this.tickCount >= this.tickDivider){
            this.tickCount = 0;
            this.tickSubject.next(true);
          }
        }
      }
    }, TICK_INTERVAL_MS);
  }
}

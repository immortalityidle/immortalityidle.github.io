import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 25;

export interface MainLoopProperties {
  unlockFastSpeed: boolean,
  unlockFasterSpeed: boolean,
  unlockFastestSpeed: boolean
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

  constructor() {
  }

  getProperties(): MainLoopProperties {
    return {
      unlockFastSpeed: this.unlockFastSpeed,
      unlockFasterSpeed: this.unlockFasterSpeed,
      unlockFastestSpeed: this.unlockFastestSpeed
    }
  }

  setProperties(properties: MainLoopProperties) {
    this.unlockFastSpeed = properties.unlockFastSpeed;
    this.unlockFasterSpeed = properties.unlockFasterSpeed;
    this.unlockFastestSpeed = properties.unlockFastestSpeed;
  }

  start() {
    // TODO: check out chrome's thing where it slows ticks way down when the tab isn't active and figure out how to compensate
    window.setInterval(()=> {
      if (!this.pause) {
        this.tickCount++;
        if (this.tickCount >= this.tickDivider){
          this.tickCount = 0;
          this.tickSubject.next(true);
        }
      }
    }, TICK_INTERVAL_MS);
  }
}

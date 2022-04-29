import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 25;
export const TICKS_PER_DAY = 2;

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  /**
   * Sends true on new day
   */
  tickSubject = new Subject<boolean>();
  pause = true;
  tickCount = 0;

  constructor() {
  }

  start() {
    window.setInterval(()=> {
      if (!this.pause) {
        this.tickCount++;
        this.tickSubject.next(this.tickCount % TICKS_PER_DAY == 0);
      }
    }, TICK_INTERVAL_MS);
  }
}

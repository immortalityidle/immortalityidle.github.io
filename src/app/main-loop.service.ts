import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 25;

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

  constructor() {
  }

  start() {
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

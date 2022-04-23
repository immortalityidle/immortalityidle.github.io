import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 50;

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  tickSubject = new Subject();
  pause = false;

  constructor() {
  }

  start() {
    window.setInterval(()=> {
      if (!this.pause) {
        this.tickSubject.next(undefined);
      }
    }, TICK_INTERVAL_MS);
  }
}

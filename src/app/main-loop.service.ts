import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TICK_INTERVAL_MS = 50;

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  tickSubject = new Subject();

  constructor() {
  }

  start() {
    window.setInterval(()=> {
      this.tickSubject.next(undefined);
    }, TICK_INTERVAL_MS);
  }
}

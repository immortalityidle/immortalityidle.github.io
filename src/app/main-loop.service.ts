import { Injectable } from '@angular/core';

const TICK_INTERVAL_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  constructor() {
  }

  start() {
    window.setInterval(()=> {
      console.log('tick tock');
    }, TICK_INTERVAL_MS);
  }
}

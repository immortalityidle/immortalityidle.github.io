import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { map, timeInterval, bufferTime } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  daysPerSecond = 0;

  constructor(mainLoopService: MainLoopService) {
    const daysPerSecond$ = mainLoopService.longTickSubject.pipe(
      timeInterval(),
      map(ticksAndTime => ticksAndTime.value / (ticksAndTime.interval / 1000)),
      bufferTime(5000),
      map(avgTPS => avgTPS.reduce((total, current) => total + current, 0) / avgTPS.length)
    );
    daysPerSecond$.subscribe(daysPerSecond => {
      this.daysPerSecond = daysPerSecond;
    });
  }
}

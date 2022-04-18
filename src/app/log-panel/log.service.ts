import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  logAdded = new Subject<string>();

  constructor() { }

  addLogMessage(message: string): void {
    // TODO: Do we need to keep these logs as state, or just pass them through?
    this.logAdded.next(message);
  }
}

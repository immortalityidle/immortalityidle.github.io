import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type LogType = 'STANDARD' | 'INJURY';

export interface Log {
  message: string,
  type: LogType
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  logAdded = new Subject<Log>();

  constructor() { }

  addLogMessage(message: string, type: LogType): void {
    this.logAdded.next({message, type});
  }
}

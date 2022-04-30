import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'REBIRTH' | 'EVENT' | 'SYSTEM';

export interface Log {
  message: string,
  type: LogType,
  topic: LogTopic
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  logAdded = new Subject<Log>();

  constructor() { }

  addLogMessage(message: string, type: LogType, topic: LogTopic): void {
    this.logAdded.next({message, type, topic});
  }
}

import { EventListenerFocusTrapInertStrategy } from '@angular/cdk/a11y';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'REBIRTH' | 'EVENT';

export interface Log {
  message: string,
  type: LogType,
  topic: LogTopic
}

export interface LogProperties {
  logTopic: LogTopic
}


@Injectable({
  providedIn: 'root'
})
export class LogService {
  logAdded = new Subject<Log>();

  logTopic: LogTopic = 'EVENT';
  enabledTopics: string = "";
  eventLog: Log[] = [
    {message: "Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", type: 'STANDARD', topic: 'EVENT'},
    {message: "Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.", type: 'STANDARD', topic: 'EVENT'},
    {message: "It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.", type: 'STANDARD', topic: 'EVENT'},
    {message: "Be careful, the world can be a dangerous place.", type: 'STANDARD', topic: 'EVENT'},
  ];

  rebirthLog: Log[] = [];
  combatLog: Log[] = [];
  currentLog = this.eventLog;

  constructor() {
    this.updateLogTopic('EVENT');
  }

  addLogMessage(message: string, type: LogType, topic: LogTopic): void {
    this.logAdded.next({message, type, topic});
  }

  getProperties(): LogProperties {
    return {
      logTopic: this.logTopic
    }
  }

  setProperties(properties: LogProperties) {
    this.updateLogTopic(properties.logTopic);
  }

  updateLogTopic(logTopic: LogTopic){
    this.logTopic = logTopic;
    if (logTopic == 'COMBAT'){
      this.currentLog = this.combatLog;
    } else if (logTopic == 'REBIRTH'){
      this.currentLog = this.rebirthLog;
    } else {
      this.currentLog = this.eventLog;
    }
  }

}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'REBIRTH' | 'EVENT' | 'SYSTEM';

export interface Log {
  message: string,
  type: LogType,
  topic: LogTopic
}

export interface LogProperties {
  systemTopicEnabled: boolean,
  combatTopicEnabled: boolean,
  rebirthTopicEnabled: boolean,
  eventTopicEnabled: boolean
}


@Injectable({
  providedIn: 'root'
})
export class LogService {
  logAdded = new Subject<Log>();

  systemTopicEnabled: boolean = true;
  combatTopicEnabled: boolean = true;
  rebirthTopicEnabled: boolean = true;
  eventTopicEnabled: boolean = true;
  enabledTopics: string = "";

  constructor() { }

  addLogMessage(message: string, type: LogType, topic: LogTopic): void {
    this.logAdded.next({message, type, topic});
  }

  getProperties(): LogProperties {
    return {
      systemTopicEnabled: this.systemTopicEnabled,
      combatTopicEnabled: this.combatTopicEnabled,
      rebirthTopicEnabled: this.rebirthTopicEnabled,
      eventTopicEnabled: this.eventTopicEnabled
    }
  }

  setProperties(properties: LogProperties) {
    this.systemTopicEnabled = properties.systemTopicEnabled;
    this.combatTopicEnabled = properties.combatTopicEnabled;
    this.rebirthTopicEnabled = properties.rebirthTopicEnabled;
    this.eventTopicEnabled = properties.eventTopicEnabled;
    this.updateEnabledTopics();
  }

  updateEnabledTopics(){
    this.enabledTopics = "";
    if (this.systemTopicEnabled){
      this.enabledTopics += 'SYSTEM';
    }
    if (this.combatTopicEnabled){
      this.enabledTopics += 'COMBAT';
    }
    if (this.rebirthTopicEnabled){
      this.enabledTopics += 'REBIRTH';
    }
    if (this.eventTopicEnabled){
      this.enabledTopics += 'EVENT';
    }

  }



}

import { Injectable } from '@angular/core';
import { isEmpty } from 'rxjs';

const LOG_MERGE_INTERVAL_MS = 1000;
export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'CRAFTING' | 'STORY' | 'EVENT';

export interface Log {
  message: string,
  type: LogType,
  topic: LogTopic,
  timestamp: number
}

export interface LogProperties {
  logTopics: LogTopic[],
  storyLog: Log[]
}

@Injectable({
  providedIn: 'root'
})
export class LogService {

  logTopics: LogTopic[] = ['STORY','EVENT'];
  newStory: string = "";
  newEvents: string = "";
  newCombat: string = "";
  newCrafting: string = "";
  storyLog: Log[] = [];
  eventLog: Log[] = [];
  combatLog: Log[] = [];
  craftingLog: Log[] = [];
  currentLog: Log[] = [];

  constructor() {
    this.addLogMessage("Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", 'STANDARD', 'STORY');
    this.addLogMessage("Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.", 'STANDARD', 'STORY');
    this.addLogMessage("It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.", 'STANDARD', 'STORY');
    this.addLogMessage("Be careful, the world can be a dangerous place.", 'STANDARD', 'STORY');
  }

  addLogMessage(message: string, type: LogType, topic: LogTopic): void {
    let log  = this.eventLog;
    if (topic == 'COMBAT'){
      log = this.combatLog;
    } else if (topic == 'STORY'){
      log = this.storyLog;
    } else if (topic == 'CRAFTING'){
      log = this.craftingLog;
    }

    let newMessage: Log = {
      message: message,
      type: type,
      topic: topic,
      timestamp: Date.now()
    };

    if (log.length == 0 || ((newMessage.timestamp - log[0].timestamp) > LOG_MERGE_INTERVAL_MS) || !log[0].message.includes(newMessage.message)) {
      // Initialization || Repeat Not Found || Repeat is not within 1 second
      log.unshift(newMessage);
      this.addToCurrentLog(newMessage);
    } else {
      // Repeat Found
      const hasRepeatNumber = /\((\d+)\)$/.exec(log[0].message)
      let repeatNumber = 2;
      if(hasRepeatNumber) {
        repeatNumber = parseInt(hasRepeatNumber[1]) + 1
      }
      
      // Update message reference
      log[0].message = `${newMessage.message} (${repeatNumber})`;
    }

    // check if we need to age off the oldest logs
    if (log.length > 100 && topic != 'STORY'){
      log.splice(100, 1);
    }
    if (!this.logTopics.includes(topic)) {
      if (topic == 'STORY'){
        this.newStory = " (new)";
      } else if (topic == 'EVENT'){
        this.newEvents = " (new)";
      } else if (topic == 'CRAFTING'){
        this.newCrafting = " (new)";
      } else {
        this.newCombat = " (new)";
      }
    }
  }

  /** Add Message To Current Log */
  private addToCurrentLog(newMessage: Log): void {
    // Maximum Log Length of 300
    if (this.currentLog.length >= 300){
      this.currentLog.pop();
    }

    this.currentLog.unshift(newMessage);
  }

  getProperties(): LogProperties {
    return {
      logTopics: this.logTopics,
      storyLog: this.storyLog
    }
  }

  setProperties(properties: LogProperties) {
    this.storyLog = properties.storyLog || [];
    this.logTopics = properties.logTopics || ['STORY','EVENT'];
    this.updateLogTopics();
  }

  enableLogTopic(topic: LogTopic, enabled: boolean){
    if (!enabled && this.logTopics.includes(topic)){
      for (let index = 0; index < this.logTopics.length; index++){
        if (this.logTopics[index] == topic){
          this.logTopics.splice(index, 1);
        }
      }
      this.updateLogTopics();
    } else if (enabled && !this.logTopics.includes(topic)){
      this.logTopics.push(topic);
      this.updateLogTopics();
    }
  }

  updateLogTopics(){
    let logs: Log[][] = [];

    if (this.logTopics.includes('COMBAT')){
      this.newCombat = "";
      logs.push([...this.combatLog]);
    }
    if (this.logTopics.includes('STORY')){
      this.newStory = "";
      logs.push([...this.storyLog]);
      }
    if (this.logTopics.includes('EVENT')){
      this.newEvents = "";
      logs.push([...this.eventLog]);
    }
    if (this.logTopics.includes('CRAFTING')){
      this.newCrafting = "";
      logs.push([...this.craftingLog]);
    }

    this.currentLog = [];
    if (logs.length == 0){
      return;
    }
    //@ts-ignore
    let isEmpty = a => Array.isArray(a) && a.every(isEmpty);
    while(!isEmpty(logs)){
      // figure out the oldest log entry and add it to the currentLog until everything is added
      let latestTimestamp = Number.MAX_VALUE;
      let latestLog: Log[] = logs[0];
      for (let index = 0; index < logs.length; index++){
        let loopLog = logs[index];
        if (loopLog.length == 0){
          continue;
        }
        let timestamp = loopLog[loopLog.length - 1].timestamp || 0;
        if (timestamp < latestTimestamp){
          latestTimestamp = timestamp;
          latestLog = loopLog;
        }
      }
      this.addToCurrentLog(latestLog[latestLog.length - 1]);
      latestLog.splice(latestLog.length - 1, 1);
    }
  }

}

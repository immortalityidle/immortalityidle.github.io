import { Injectable } from '@angular/core';
import { isEmpty } from 'rxjs';

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
  newStory = "";
  newEvents = "";
  newCombat = "";
  newCrafting = "";
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

    const newMessage = {
      message: message,
      type: type,
      topic: topic,
      timestamp: Date.now()
    };
    log.unshift(newMessage);
    // check if we need to age off the oldest logs
    if (log.length > 100 && topic != 'STORY'){
      log.splice(100, 1);
    }
    if (this.logTopics.includes(topic)){
      this.addToCurrentLog(newMessage);
    } else {
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

  addToCurrentLog(newMessage: Log){
    if (this.currentLog.length != 0 && this.currentLog[0].message.includes(newMessage.message)){
      // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
      const repeatCountString = this.currentLog[0].message.split(" ").pop()?.replace("(", "")?.replace(")", "");
      let repeatCount = 0;
      if (repeatCountString){
        repeatCount = parseInt(repeatCountString);
      }
      if (repeatCount != 0 && !isNaN(repeatCount)){
        repeatCount++;
        this.currentLog[0].message = newMessage.message + " (" + repeatCount + ")";
      } else {
        // it's the first repeat, give it a repeat count
        this.currentLog[0].message = newMessage.message + " (2)";
      }
    } else {
      this.currentLog.unshift(newMessage);
      if (this.currentLog.length > 300){
        // peel off the oldest
        this.currentLog.splice(this.currentLog.length - 1, 1);
      }
      
    }
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
    const logs: Log[][] = [];

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
    const isEmpty = a => Array.isArray(a) && a.every(isEmpty);
    while(!isEmpty(logs)){
      // figure out the oldest log entry and add it to the currentLog until everything is added
      let latestTimestamp = Number.MAX_VALUE;
      let latestLog: Log[] = logs[0];
      for (let index = 0; index < logs.length; index++){
        const loopLog = logs[index];
        if (loopLog.length == 0){
          continue;
        }
        const timestamp = loopLog[loopLog.length - 1].timestamp || 0;
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

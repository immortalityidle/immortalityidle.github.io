import { Injectable } from '@angular/core';

export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'STORY' | 'EVENT';

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
  storyLog: Log[] = [];
  eventLog: Log[] = [];
  combatLog: Log[] = [];
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
    }

    let newMessage = {
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
      } else {
        this.newCombat = " (new)";
      }
    }
  }

  addToCurrentLog(newMessage: Log){
    if (this.currentLog.length != 0 && this.currentLog[0].message.includes(newMessage.message)){
      // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
      let repeatCountString = this.currentLog[0].message.split(" ").pop()?.replace("(", "")?.replace(")", "");
      let repeatCount: number = 0;
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
    let combatLog: Log[] = [];
    let eventLog: Log[] = [];
    let storyLog: Log[] = [];

    if (this.logTopics.includes('COMBAT')){
      this.newCombat = "";
      combatLog = [...this.combatLog];
    }
    if (this.logTopics.includes('STORY')){
      this.newStory = "";
      storyLog = [...this.storyLog];
      }
    if (this.logTopics.includes('EVENT')){
      this.newEvents = "";
      eventLog = [...this.eventLog];
    }

    this.currentLog = [];

    while(combatLog.length != 0 || eventLog.length != 0 || storyLog.length != 0){
      // figure out the oldest log entry and add it to the currentLog until everything is added
      let latestTimestamp = Number.MAX_VALUE;
      let latestLog: Log[] = combatLog;
      if (combatLog.length != 0){
        let combatTimestamp = combatLog[combatLog.length - 1].timestamp || 0;
        if (combatTimestamp < latestTimestamp){
          latestTimestamp = combatTimestamp;
        }
      }
      if (storyLog.length != 0){
        let storyTimestamp = storyLog[storyLog.length - 1].timestamp || 0;
        if (storyTimestamp < latestTimestamp){
          latestLog = storyLog;
          latestTimestamp = storyTimestamp;
        }
      }
      if (eventLog.length != 0){
        let eventTimestamp = eventLog[eventLog.length - 1].timestamp || 0;
        if (eventTimestamp < latestTimestamp){
          latestLog = eventLog;
          latestTimestamp = eventTimestamp;
        }
      }
      this.addToCurrentLog(latestLog[latestLog.length - 1]);
      latestLog.splice(latestLog.length - 1, 1);
    }

  }

}

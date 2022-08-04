import { Injectable } from '@angular/core';
import { isEmpty } from 'rxjs';
import { MainLoopService } from './main-loop.service';

const LOG_MERGE_INTERVAL_MS = 1000;
export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'CRAFTING' | 'FOLLOWER' | 'STORY' | 'EVENT';

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
  newFollower = "";
  storyLog: Log[] = [];
  eventLog: Log[] = [];
  combatLog: Log[] = [];
  craftingLog: Log[] = [];
  followerLog: Log[] = [];
  currentLog: Log[] = [];

  constructor(
    
    mainLoopService: MainLoopService
  ) {
    mainLoopService.frameSubject.subscribe(() => {
      this.updateLogTopics();
    });
    this.addLogMessage("Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", 'STANDARD', 'STORY');
    this.addLogMessage("Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.", 'STANDARD', 'STORY');
    this.addLogMessage("It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.", 'STANDARD', 'STORY');
    this.addLogMessage("Be careful, the world can be a dangerous place.", 'STANDARD', 'STORY');
  }

  addLogMessage(message: string, type: LogType, topic: LogTopic): void {
    let log  = this.eventLog;
    if (topic === 'COMBAT') {
      log = this.combatLog;
    } else if (topic === 'STORY') {
      log = this.storyLog;
    } else if (topic === 'CRAFTING') {
      log = this.craftingLog;
    } else if (topic === 'FOLLOWER') {
      log = this.followerLog;
    }

    const newMessage: Log = {
      message: message,
      type: type,
      topic: topic,
      timestamp: Date.now()
    };

    if (log.length === 0 || ((newMessage.timestamp - log[0].timestamp) > LOG_MERGE_INTERVAL_MS) || !log[0].message.includes(newMessage.message)) {
      // Initialization || Repeat Not Found || Repeat is not within 1 second
      log.push(newMessage);
    } else {
      // Repeat Found
      const hasRepeatNumber = /\((\d+)\)$/.exec(log[0].message);
      let repeatNumber = 2;
      if(hasRepeatNumber) {
        repeatNumber = parseInt(hasRepeatNumber[1]) + 1;
      }
      
      // Update message reference
      log[0].message = `${newMessage.message} (${repeatNumber})`;
    }

    // check if we need to age off the oldest logs
    if (!this.logTopics.includes(topic)) {
      if (topic === 'STORY') {
        this.newStory = " (new)";
      } else if (topic === 'EVENT'){
        this.newEvents = " (new)";
      } else if (topic === 'CRAFTING'){
        this.newCrafting = " (new)";
      } else if (topic === 'COMBAT') {
        this.newCombat = " (new)";
      } else if (topic === 'FOLLOWER') {
        this.newFollower = " (new)";
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
        if (this.logTopics[index] === topic){
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
    const logs: Log[] = [];

    if (this.logTopics.includes('STORY')){
      this.newStory = "";
      logs.push(...this.storyLog);
    }
    if (this.logTopics.includes('EVENT')){
      this.newEvents = "";
      this.eventLog = this.eventLog.slice(-300)
      logs.push(...this.eventLog);
    }
    if (this.logTopics.includes('COMBAT')){
      this.newCombat = "";
      this.combatLog = this.combatLog.slice(-300)
      logs.push(...this.combatLog);
    }
    if (this.logTopics.includes('CRAFTING')){
      this.newCrafting = "";
      this.craftingLog = this.craftingLog.slice(-300)
      logs.push(...this.craftingLog);
    }
    if (this.logTopics.includes('FOLLOWER')){
      this.newFollower = "";
      this.followerLog = this.followerLog.slice(-300)
      logs.push(...this.followerLog);
    }

    if (logs.length === 0){
      return;
    }
    logs.sort((a,b) => b.timestamp - a.timestamp);
    this.currentLog = logs.slice(0,299);
  }

}

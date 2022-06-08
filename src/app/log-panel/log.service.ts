import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type LogType = 'STANDARD' | 'INJURY';
export type LogTopic = 'COMBAT' | 'STORY' | 'EVENT';

export interface Log {
  message: string,
  type: LogType,
  topic: LogTopic
}

export interface LogProperties {
  logTopic: LogTopic,
  storyLog: Log[]
}


@Injectable({
  providedIn: 'root'
})
export class LogService {

  logTopic: LogTopic = 'STORY';
  enabledTopics: string = "";
  storyLog: Log[] = [
    {message: "Be careful, the world can be a dangerous place.", type: 'STANDARD', topic: 'STORY'},
    {message: "It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.", type: 'STANDARD', topic: 'STORY'},
    {message: "Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.", type: 'STANDARD', topic: 'STORY'},
    {message: "Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", type: 'STANDARD', topic: 'STORY'},
  ];

  eventLog: Log[] = [];
  combatLog: Log[] = [];
  currentLog = this.storyLog;

  constructor() {
    this.updateLogTopic('STORY');
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
      topic: topic
    };
    if (log.length == 0){
      log.unshift(newMessage);
    } else if (log[0].message.includes(message)){
      // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
      let repeatCountString = log[0].message.split(" ").pop()?.replace("(", "")?.replace(")", "");
      let repeatCount: number = 0;
      if (repeatCountString){
        repeatCount = parseInt(repeatCountString);
      }
      if (repeatCount != 0 && !isNaN(repeatCount)){
        repeatCount++;
        log[0].message = message + " (" + repeatCount + ")";
      } else {
        // it's the first repeat, give it a repeat count
        log[0].message = message + " (2)";
      }
    } else {
      log.unshift(newMessage);
    }
    // check if we need to age off the oldest logs
    if (log.length > 100 && topic != 'STORY'){
      log.splice(100, 1);
    }
  }

  getProperties(): LogProperties {
    return {
      logTopic: this.logTopic,
      storyLog: this.storyLog
    }
  }

  setProperties(properties: LogProperties) {
    this.updateLogTopic(properties.logTopic);
    this.storyLog = properties.storyLog || [];
  }

  updateLogTopic(logTopic: LogTopic){
    this.logTopic = logTopic;
    if (logTopic == 'COMBAT'){
      this.currentLog = this.combatLog;
    } else if (logTopic == 'STORY'){
      this.currentLog = this.storyLog;
    } else {
      this.currentLog = this.eventLog;
    }
  }

  reset(){
    this.storyLog = [
      {message: "Be careful, the world can be a dangerous place.", type: 'STANDARD', topic: 'STORY'},
      {message: "It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.", type: 'STANDARD', topic: 'STORY'},
      {message: "Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.", type: 'STANDARD', topic: 'STORY'},
      {message: "Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", type: 'STANDARD', topic: 'STORY'},
    ];
    this.eventLog = [];
    this.combatLog = [];
  }

}

import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';

type AllTopicProperties = { [key: string]: TopicProperties };

export enum LogType {
  Standard = 'STANDARD',
  Injury = 'INJURY',
}

export interface Log {
  message: string;
  type: LogType;
  topic: LogTopic;
  timestamp: number;
  repeat: number;
}

export interface LogProperties {
  logTopics: Uppercase<LogTopic>[];
  storyLog: Log[];
  startingStoryLogEntries: string[];
}

export enum LogTopic {
  STORY = 'Story',
  EVENT = 'Event',
  COMBAT = 'Combat',
  CRAFTING = 'Crafting',
  FOLLOWER = 'Follower',
}

export interface TopicProperties {
  enabled: boolean;
  hasNewMessages: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  topicProperties: AllTopicProperties = Object.values(LogTopic).reduce(
    (result, topic) => ({
      ...result,
      [topic]: {
        enabled: [LogTopic.STORY, LogTopic.EVENT].includes(topic),
        hasNewMessages: false,
      },
    }),
    {} as AllTopicProperties
  );

  logs: Record<LogTopic, Log[]> = Object.values(LogTopic).reduce(
    (result, topic) => ({ ...result, [topic]: [] }),
    {} as Record<LogTopic, Log[]>
  );

  currentLog: Log[] = [];

  startingStoryLogEntries = [
    'Once in a very long while, a soul emerges from the chaos that is destined for immortality.',
    'You are such a soul.',
    'Your journey to immortality begins as a humble youth leaves home to experience the world.',
    'Choose the activities that will help you cultivate the attributes of an immortal.',
    'Be careful, the world can be a dangerous place.',
    'It may take you many reincarnations before you achieve your goals.',
    'With each new life you will rise with greater aptitudes that allow you to learn and grow faster.',
    'Destiny cannot be denied.',
    'One day, you will be immortal!',
  ];
  longTickCounter = 0;

  constructor(mainLoopService: MainLoopService) {
    mainLoopService.longTickSubject.subscribe(() => {
      if (this.startingStoryLogEntries.length > 0) {
        if (this.longTickCounter > 10) {
          this.longTickCounter = 0;
        } else {
          this.longTickCounter++;
          return;
        }
        this.log(LogTopic.STORY, this.startingStoryLogEntries[0]);
        this.startingStoryLogEntries.splice(0, 1);
      }
      setTimeout(() => this.updateLogTopics());
    });
  }

  log(topic: LogTopic, message: string): void {
    setTimeout(() => this.fullLog(topic, LogType.Standard, message));
  }

  injury(topic: LogTopic, message: string): void {
    setTimeout(() => this.fullLog(topic, LogType.Injury, message));
  }

  fullLog(topic: LogTopic, type: LogType, rawMessage: string): void {
    const log = this.logs[topic];
    const timestamp = Date.now();
    const message = rawMessage.replaceAll('<br>', ' ');
    if (log.length === 0 || message !== log[log.length - 1].message) {
      log.push({
        message: message,
        type: type,
        topic: topic,
        timestamp: timestamp,
        repeat: 1,
      });
    } else {
      log[log.length - 1].repeat++;
    }

    if (!this.topicProperties[topic].enabled) {
      this.topicProperties[topic].hasNewMessages = true;
    }
  }

  getProperties(): LogProperties {
    return {
      logTopics: Object.entries(this.topicProperties)
        .filter(entry => entry[1].enabled)
        .map(entry => entry[0] as LogTopic)
        .map(topic => topic.toUpperCase() as Uppercase<LogTopic>),
      storyLog: this.logs[LogTopic.STORY],
      startingStoryLogEntries: this.startingStoryLogEntries,
    };
  }

  setProperties(properties: LogProperties) {
    this.logs[LogTopic.STORY] = properties.storyLog;
    properties.logTopics.forEach(topic => {
      this.topicProperties[LogTopic[topic]].enabled = true;
    });
    this.startingStoryLogEntries = properties.startingStoryLogEntries;

    this.updateLogTopics();
  }

  enableLogTopic(topic: LogTopic, enabled: boolean) {
    this.topicProperties[topic].enabled = enabled;
    this.updateLogTopics();
  }

  updateLogTopics() {
    Object.values(LogTopic).forEach(topic => {
      if (topic !== LogTopic.STORY) {
        this.logs[topic] = this.logs[topic].slice(-300);
      }
      if (this.topicProperties[topic].enabled) {
        this.topicProperties[topic].hasNewMessages = false;
      }
    });

    this.currentLog = Object.keys(this.logs)
      .map(topic => topic as LogTopic)
      .filter(topic => this.topicProperties[topic].enabled)
      .flatMap(topic => this.logs[topic])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 299);
  }
}

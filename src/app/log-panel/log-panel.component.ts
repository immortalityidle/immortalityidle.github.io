import { Component, OnInit } from '@angular/core';
import { Log, LogService, LogTopic } from './log.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less', '../app.component.less']
})
export class LogPanelComponent {

  constructor(public logService: LogService) {
  }

  topicFilterCombat(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('COMBAT');
  }
  topicFilterStory(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('STORY');
  }
  topicFilterEvent(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('EVENT');
  }
}

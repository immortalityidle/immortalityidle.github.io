import { Component, OnInit } from '@angular/core';
import { Log, LogService, LogTopic } from '../game-state/log.service';

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
    this.logService.enableLogTopic('COMBAT', event.target.checked);
  }
  topicFilterStory(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic('STORY', event.target.checked);
  }
  topicFilterEvent(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic('EVENT', event.target.checked);
  }
}

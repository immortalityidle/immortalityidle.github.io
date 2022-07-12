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

  topicFilter(event: Event, topic: LogTopic ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic(topic, event.target.checked);
  }
}

import { Component, OnInit } from '@angular/core';
import { Log, LogService, LogTopic } from '../game-state/log.service';

@Component({
  selector: 'app-log-filter-panel',
  templateUrl: './log-filter-panel.component.html',
  styleUrls: ['./log-filter-panel.component.less'],
})
export class LogFilterPanelComponent {
  constructor(public logService: LogService) {}

  topicFilter(event: Event, topic: LogTopic) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic(topic, event.target.checked);
  }
}

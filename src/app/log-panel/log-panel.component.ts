import { Component } from '@angular/core';
import { LogService, LogTopic } from '../game-state/log.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { LogFilterPanelComponent } from '../log-filter-panel/log-filter-panel.component';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less', '../app.component.less'],
})
export class LogPanelComponent {
  constructor(public logService: LogService, public dialog: MatDialog) {}

  topicFilter(event: Event, topic: LogTopic) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic(topic, event.target.checked);
  }

  logFilterClicked(): void {
    this.dialog.open(LogFilterPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}

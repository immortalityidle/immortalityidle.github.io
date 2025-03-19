import { Component } from '@angular/core';
import { LogService, LogTopic } from '../game-state/log.service';
import { MatDialog } from '@angular/material/dialog';
import { LogFilterPanelComponent } from '../log-filter-panel/log-filter-panel.component';
import { GameStateService } from '../game-state/game-state.service';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '@webed/angular-tooltip';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less', '../app.component.less'],
  imports: [MatIcon, TooltipDirective, NgClass],
})
export class LogPanelComponent {
  constructor(public logService: LogService, public gameStateService: GameStateService, public dialog: MatDialog) {}

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

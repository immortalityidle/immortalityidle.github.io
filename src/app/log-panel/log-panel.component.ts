import { Component, forwardRef } from '@angular/core';
import { LogService, LogTopic } from '../game-state/log.service';
import { MatDialog } from '@angular/material/dialog';
import { LogFilterPanelComponent } from '../log-filter-panel/log-filter-panel.component';
import { GameStateService } from '../game-state/game-state.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less', '../app.component.less'],
  imports: [forwardRef(() => MatIcon), forwardRef(() => NgClass), forwardRef(() => TooltipDirective)],
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

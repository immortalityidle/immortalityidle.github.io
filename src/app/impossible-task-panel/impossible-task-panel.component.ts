import { Component } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { GameStateService } from '../game-state/game-state.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';

@Component({
  selector: 'app-impossible-task-panel',
  templateUrl: './impossible-task-panel.component.html',
  styleUrls: ['./impossible-task-panel.component.less', '../app.component.less'],
})
export class ImpossibleTaskPanelComponent {
  Math: Math;
  constructor(
    public impossibleTaskService: ImpossibleTaskService,
    public gameStateService: GameStateService,
    public activityService: ActivityService
  ) {
    this.Math = Math;
  }

  pauseOnImpossibleFailChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseOnImpossibleFail = event.target.checked;
  }
}

import { Component, forwardRef } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { MatIcon } from '@angular/material/icon';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-time-options-panel',
  templateUrl: './time-options-panel.component.html',
  styleUrls: ['./time-options-panel.component.less', '../app.component.less'],
  imports: [forwardRef(() => MatIcon)],
})
export class TimeOptionsPanelComponent {
  constructor(public activityService: ActivityService, public homeService: HomeService) {}

  pauseOnDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseOnDeath = event.target.checked;
  }

  pauseBeforeDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseBeforeDeath = event.target.checked;
  }

  autoPauseThugs(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.homeService.thugPause = !this.homeService.thugPause;
  }
}

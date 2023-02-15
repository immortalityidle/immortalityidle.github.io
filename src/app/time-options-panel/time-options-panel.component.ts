import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';

@Component({
  selector: 'app-time-options-panel',
  templateUrl: './time-options-panel.component.html',
  styleUrls: ['./time-options-panel.component.less', '../app.component.less'],
})
export class TimeOptionsPanelComponent implements OnInit {
  constructor(public activityService: ActivityService) {}

  ngOnInit(): void {}

  pauseOnDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseOnDeath = event.target.checked;
  }

  pauseBeforeDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseBeforeDeath = event.target.checked;
  }
}

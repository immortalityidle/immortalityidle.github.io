import { Component } from '@angular/core';
import { ActivityService, DisplayActivity } from '../game-state/activity.service';

@Component({
  selector: 'app-activity-options-modal',
  imports: [],
  templateUrl: './activity-options-modal.component.html',
  styleUrl: './activity-options-modal.component.less',
})
export class ActivityOptionsModalComponent {
  constructor(public activityService: ActivityService) {}

  entryToggled(event: Event, entry: DisplayActivity) {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.checked) {
      const index = this.activityService.hiddenActivities.indexOf(entry.activity.activityType);
      if (index !== -1) {
        this.activityService.hiddenActivities.splice(index, 1);
      }
      entry.hidden.set(false);
    } else {
      if (!this.activityService.hiddenActivities.includes(entry.activity.activityType)) {
        this.activityService.hiddenActivities.push(entry.activity.activityType);
      }
      entry.hidden.set(true);
    }
  }
}

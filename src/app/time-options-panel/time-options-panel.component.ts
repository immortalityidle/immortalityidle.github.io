import { Component, forwardRef } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { HomeService } from '../game-state/home.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-time-options-panel',
  templateUrl: './time-options-panel.component.html',
  styleUrls: ['./time-options-panel.component.less', '../app.component.less'],
  imports: [forwardRef(() => MatSelectModule)],
})
export class TimeOptionsPanelComponent {
  selectedLoad = '';
  inputSave = 'Saved Schedule #1';

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

  inputSaveChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inputSave = event.target.value;
  }

  saveActivityLoop() {
    console.log('saving as' + this.inputSave);
    this.activityService.saveActivityLoop(this.inputSave);
  }

  loadActivityLoop() {
    this.activityService.loadActivityLoop(this.selectedLoad);
  }
}

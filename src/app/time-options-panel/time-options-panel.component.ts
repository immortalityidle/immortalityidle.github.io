import { Component, forwardRef } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { HomeService } from '../game-state/home.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { LoopChangeTrigger } from '../game-state/activity';
import { CharacterService } from '../game-state/character.service';
import { CamelToTitlePipe } from '../pipes';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-time-options-panel',
  templateUrl: './time-options-panel.component.html',
  styleUrls: ['./time-options-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => MatSelectModule),
    forwardRef(() => MatTabGroup),
    forwardRef(() => MatTab),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class TimeOptionsPanelComponent {
  inputSave = 'Saved Schedule #1';
  attributeKeys: string[];
  statusMaxes: string[];

  constructor(
    public activityService: ActivityService,
    public homeService: HomeService,
    public characterService: CharacterService
  ) {
    this.attributeKeys = Object.keys(this.characterService.attributes);
    this.statusMaxes = Object.keys(this.characterService.status);
  }

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
    this.activityService.saveActivityLoop(this.inputSave);
  }

  loadActivityLoop(saveName: string) {
    this.activityService.loadActivityLoop(saveName);
  }

  removeActivityLoop(saveName: string) {
    this.activityService.removeActivityLoop(saveName);
  }

  triggerValueChange(event: Event, trigger: LoopChangeTrigger) {
    if (!(event.target instanceof HTMLInputElement)) return;
    trigger.value = parseInt(event.target.value);
  }

  removeTrigger(trigger: LoopChangeTrigger) {
    const index = this.activityService.loopChangeTriggers.indexOf(trigger);
    this.activityService.loopChangeTriggers.splice(index, 1);
  }

  addTrigger() {
    this.activityService.loopChangeTriggers.push({
      attribute: 'strength',
      value: 100,
      scheduleName: '',
    });
  }
}

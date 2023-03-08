import { Component } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { TimeOptionsPanelComponent } from '../time-options-panel/time-options-panel.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less'],
})
export class TimePanelComponent {
  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;

  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public dialog: MatDialog
  ) {}

  pauseClick() {
    if (this.mainLoopService.pause) {
      this.mainLoopService.tick();
    } else {
      this.mainLoopService.pause = true;
    }
  }

  slowClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 40;
  }

  standardClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 10;
  }

  fastClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 5;
  }

  fasterClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 2;
  }

  fastestClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 1;
  }

  timeOptions() {
    this.dialog.open(TimeOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  onPlusClick(entry: ActivityLoopEntry, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1;
    repeat *= event.shiftKey || event.altKey ? 10 : 1;
    repeat *= event.ctrlKey || event.metaKey ? 10 : 1;

    entry.repeatTimes += repeat;
  }

  onMinusClick(entry: ActivityLoopEntry, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1;
    repeat *= event.shiftKey || event.altKey ? 10 : 1;
    repeat *= event.ctrlKey || event.metaKey ? 10 : 1;

    entry.repeatTimes -= repeat;

    if (entry.repeatTimes < 0) {
      entry.repeatTimes = 0;
    }
  }

  onRemoveClick(entry: ActivityLoopEntry): void {
    const index = this.activityService.activityLoop.indexOf(entry);
    // make sure we're not running past the end of the entries array
    if (this.activityService.currentIndex >= this.activityService.activityLoop.length - 1) {
      this.activityService.currentIndex = 0;
    }
    this.activityService.activityLoop.splice(index, 1);
  }

  onDisableClick(entry: ActivityLoopEntry): void {
    entry.disabled = !entry.disabled;
    if (!entry.disabled) {
      // make sure nothing that can't be enabled gets enabled
      this.activityService.checkRequirements(true);
    }
  }

  removeSpiritActivity() {
    this.activityService.spiritActivity = null;
  }

  useSavedTicks(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.useBankedTicks = event.target.checked;
  }

  allowDrop(event: DragEvent) {
    if (event.dataTransfer?.types[0] === 'activityloop' || event.dataTransfer?.types[0] === 'activity') {
      event.preventDefault();
    }
  }

  drag(sourceIndex: number, event: DragEvent) {
    if (this.activityService.activityLoop[sourceIndex].disabled) {
      // don't allow drag and drop of disabled activities
      return;
    }
    event.dataTransfer?.setData('activityloop', '' + sourceIndex);
  }

  drop(destIndex: number, event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    let sourceIndexString: string = event.dataTransfer?.getData('activityloop') + '';
    if (sourceIndexString === '') {
      sourceIndexString = event.dataTransfer?.getData('activity') + '';
      if (sourceIndexString === '') {
        // could find a source from either of the acceptable locations
        return;
      }
      const sourceType = parseInt(sourceIndexString);
      const newEntry = {
        activity: sourceType,
        repeatTimes: 1,
      };
      if (destIndex >= this.activityService.activityLoop.length) {
        this.activityService.activityLoop.push(newEntry);
      } else {
        this.activityService.activityLoop.splice(destIndex, 0, newEntry);
      }
    } else {
      const sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length) {
        const activity = this.activityService.activityLoop.splice(sourceIndex, 1);
        if (destIndex >= this.activityService.activityLoop.length) {
          this.activityService.activityLoop.push(activity[0]);
        } else {
          this.activityService.activityLoop.splice(destIndex, 0, activity[0]);
        }
      }
    }
  }

  spiritActivityDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    let sourceIndexString: string = event.dataTransfer?.getData('activityloop') + '';
    if (sourceIndexString === '') {
      sourceIndexString = event.dataTransfer?.getData('activity') + '';
      if (sourceIndexString === '') {
        // could find a source from either of the acceptable locations
        return;
      }
      const sourceType = parseInt(sourceIndexString);
      this.activityService.spiritActivity = sourceType;
    } else {
      const sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length) {
        const activity = this.activityService.activityLoop[sourceIndex].activity;
        this.activityService.spiritActivity = activity;
      }
    }
  }

  getActivityName(activityType: ActivityType) {
    const activity = this.activityService.getActivityByType(activityType);
    if (activity) {
      return activity.name[activity.level];
    }
    return '';
  }
}

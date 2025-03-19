import { Component } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { TimeOptionsPanelComponent } from '../time-options-panel/time-options-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { BattleService } from '../game-state/battle.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less'],
  standalone: false,
})
export class TimePanelComponent {
  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public gameStateService: GameStateService,
    public battleService: BattleService,
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

  dragStart() {
    this.gameStateService.dragging = true;
  }

  dragEnd() {
    this.gameStateService.dragging = false;
  }

  dragMoved(event: CdkDragMove) {
    this.dragPositionX = event.pointerPosition.x;
    this.dragPositionY = event.pointerPosition.y;
  }

  // this function feels super hacky and I kind of hate it, but it was the only way I could get the angular drag and drop stuff to do what I wanted
  dragReleased(event: CdkDragRelease) {
    let x: number;
    let y: number;
    if (event.event instanceof MouseEvent) {
      x = event.event.clientX;
      y = event.event.clientY;
    } else if (event.event instanceof TouchEvent) {
      x = this.dragPositionX;
      y = this.dragPositionY;
    } else {
      return;
    }

    const sourceIndex = event.source.data;
    const elements = document.elementsFromPoint(x, y);
    let destIndex = this.activityService.activityLoop.length;
    let acceptDrop = false;
    let spiritActivity = false;
    for (const element of elements) {
      if (element.id === 'activityDropDiv') {
        acceptDrop = true;
      } else if (element.id.startsWith('activityLoopIndex')) {
        destIndex = parseInt(element.id.substring('activityLoopIndex'.length + 1));
      } else if (element.id === 'spiritActivity') {
        spiritActivity = true;
      }
    }
    if (acceptDrop && sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length) {
      if (spiritActivity) {
        const activity = this.activityService.activityLoop[sourceIndex].activity;
        this.activityService.spiritActivity = activity;
      } else {
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

  showActivity(event: MouseEvent, activityType: ActivityType) {
    event.stopPropagation();
    const activity = this.activityService.getActivityByType(activityType);
    if (activity === null) {
      return;
    }
    let bodyString = activity.description[activity.level] + '\n\n' + activity.consequenceDescription[activity.level];
    bodyString += this.activityService.getYinYangDescription(activity.yinYangEffect[activity.level]);
    if (activity.projectionOnly) {
      bodyString +=
        '\n\nThis activity can only be performed by a spiritual projection of yourself back in the mortal realm.';
    }

    const dialogProperties = { titleText: activity.name[activity.level], bodyText: bodyString, imageFile: '' };
    if (activity.imageBaseName) {
      dialogProperties.imageFile = 'assets/images/activities/' + activity.imageBaseName + activity.level + '.png';
    }
    this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: dialogProperties,
      autoFocus: false,
    });
  }
}

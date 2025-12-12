import { Component, forwardRef, inject } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { HellService } from '../game-state/hell.service';
import { MatDialog } from '@angular/material/dialog';
import { MainLoopService } from '../game-state/main-loop.service';
import { CdkDragMove, CdkDragRelease, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { BattleService } from '../game-state/battle.service';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { ActivityPanelService } from './activity-panel.service';
import { ActivityOptionsModalComponent } from '../activity-options-modal/activity-options-modal.component';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => CdkDropList),
    forwardRef(() => CdkDrag),
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TooltipDirective),
  ],
})
export class ActivityPanelComponent {
  protected Math = Math;

  protected activityService = inject(ActivityService);
  protected activityPanelService = inject(ActivityPanelService);
  protected battleService = inject(BattleService);
  protected characterService = inject(CharacterService);
  protected hellService = inject(HellService);
  protected mainLoopService = inject(MainLoopService);

  private dragPositionX = 0;
  private dragPositionY = 0;

  constructor(private gameStateService: GameStateService, private dialog: MatDialog) {}

  protected scheduleActivity(activity: Activity, event: MouseEvent): void {
    event.stopPropagation();

    if (activity.projectionOnly) {
      this.activityService.spiritActivity = activity.activityType;
      return;
    }

    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1;
    repeat *= event.shiftKey || event.altKey ? 10 : 1;
    repeat *= event.ctrlKey || event.metaKey ? 10 : 1;

    // Alt will put it at the top of the schedule, otherwise the bottom
    if (event.altKey) {
      this.activityService.activityLoop.unshift({
        activity: activity.activityType,
        repeatTimes: repeat,
      });
    } else {
      this.activityService.activityLoop.push({
        activity: activity.activityType,
        repeatTimes: repeat,
      });
    }
  }

  protected rightClick(activity: Activity, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activityService.spiritActivity = activity.activityType;
  }

  protected dragStart() {
    this.gameStateService.dragging = true;
  }

  protected dragEnd() {
    this.gameStateService.dragging = false;
  }

  protected dragMoved(event: CdkDragMove) {
    this.dragPositionX = event.pointerPosition.x;
    this.dragPositionY = event.pointerPosition.y;
  }

  // this function feels super hacky and I kind of hate it, but it was the only way I could get the angular drag and drop stuff to do what I wanted
  protected dragReleased(event: CdkDragRelease) {
    event.event.preventDefault();
    event.event.stopPropagation();

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
    if (acceptDrop) {
      const activityType = event.source.data;
      if (this.activityService.getActivityByType(activityType)?.projectionOnly) {
        spiritActivity = true;
      }
      if (spiritActivity) {
        this.activityService.spiritActivity = activityType;
      } else {
        const newEntry = {
          activity: activityType,
          repeatTimes: 1,
        };
        if (destIndex >= this.activityService.activityLoop.length) {
          this.activityService.activityLoop.push(newEntry);
        } else {
          this.activityService.activityLoop.splice(destIndex, 0, newEntry);
        }
      }
    }
  }

  optionsClicked() {
    this.dialog.open(ActivityOptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}

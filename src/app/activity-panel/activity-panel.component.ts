import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity, ActivityType } from '../game-state/activity';
import { Character } from '../game-state/character';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { JoinTheGodsText } from '../game-state/textResources';
import { InventoryService } from '../game-state/inventory.service';
import { FollowersService } from '../game-state/followers.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { BigNumberPipe, CamelToTitlePipe } from '../app.component';
import { MainLoopService } from '../game-state/main-loop.service';
import { LogService, LogTopic } from '../game-state/log.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less'],
})
export class ActivityPanelComponent {
  camelToTitle = new CamelToTitlePipe();
  character: Character;
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public hellService: HellService,
    private inventoryService: InventoryService,
    private followerService: FollowersService,
    public impossibleTaskService: ImpossibleTaskService,
    public dialog: MatDialog,
    private bigNumberPipe: BigNumberPipe,
    public mainLoopService: MainLoopService,
    private logService: LogService
  ) {
    this.Math = Math;
    this.character = characterService.characterState;
  }

  JoinTheGodsClick() {
    if (
      !confirm(
        'Are you sure you are ready for this? You will need to leave all your money and most of your followers and possessions behind as you leave this mortal realm.'
      )
    ) {
      return;
    }
    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '700px',
      data: { titleText: 'Joining the Gods', bodyText: JoinTheGodsText },
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(() => {
      this.hellService.inHell = true;
      this.characterService.characterState.money = 0;
      this.inventoryService.stashInventory();
      this.followerService.hellPurge();
      this.activityService.reloadActivities();
    });
  }

  scheduleActivity(activity: Activity, event: MouseEvent): void {
    event.stopPropagation();
    if (!activity.unlocked) {
      return;
    }

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

  doActivity(activity: Activity) {
    if (!this.activityService.meetsRequirements(activity)) {
      this.logService.log(LogTopic.EVENT, activity.name[activity.level] + ' is unavailable now.');
      return;
    }
    const failedStatus = this.activityService.checkResourceUse(activity);
    if (failedStatus !== '') {
      this.characterService.characterState.flashStatus(failedStatus);
      this.logService.log(
        LogTopic.EVENT,
        "You don't meet the requirements to do " + activity.name[activity.level] + ' right now.'
      );
      return;
    }

    this.activityService.immediateActivity = activity;
    this.mainLoopService.tick();
    this.activityService.immediateActivity = null;
  }

  rightClick(activity: Activity, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activityService.spiritActivity = activity.activityType;
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

  hellBoss() {
    this.hellService.fightHellBoss();
  }

  getActivityTooltip(activity: Activity, doNow = false) {
    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell) {
      return '';
    } else if (activity.unlocked) {
      if (doNow) {
        return 'Spend a day doing this activity';
      } else {
        let projectionString = '';
        if (this.characterService.characterState.manaUnlocked) {
          projectionString = '<br>Right-click to set this as your spriritual projection activity';
        }
        return (
          'Add this activity to your schedule<br>Shift- or Ctrl-click to repeat it 10x<br>Shift-Ctrl-click to repeat it 100x<br>Alt-click to add it to the top' +
          projectionString
        );
      }
    } else {
      return [
        'This activity is locked until you have the attributes required for it. You will need:<br>',
        ...Object.entries(activity.requirements[0]).map(entry =>
          entry[1] ? `${this.camelToTitle.transform(entry[0])}: ${this.bigNumberPipe.transform(entry[1])}` : undefined
        ),
      ]
        .filter(line => line)
        .join('<br>');
    }
  }

  showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    let bodyString = activity.description[activity.level] + '\n\n' + activity.consequenceDescription[activity.level];
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

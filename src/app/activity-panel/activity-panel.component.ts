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
import { MainLoopProperties, MainLoopService } from '../game-state/main-loop.service';
import { LogService, LogTopic } from '../game-state/log.service';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less'],
})
export class ActivityPanelComponent {
  camelToTitle = new CamelToTitlePipe();
  character: Character;
  Math: Math;

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
    private mainLoopService: MainLoopService,
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
    if (!activity.unlocked) {
      return;
    }

    if (activity.instant) {
      activity.consequence[activity.level]();
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

  doActivity(activity: Activity){
    if (activity.instant) {
      activity.consequence[activity.level]();
      return;
    }
    if (!this.activityService.meetsRequirements(activity)){
      this.logService.log(LogTopic.EVENT, activity.name[activity.level] + " is unavailable now.");
      return;
    } 
    if (!this.activityService.checkResourceUse(activity)){
      this.logService.log(LogTopic.EVENT, "You don't meet the requirements to do " + activity.name[activity.level] + " right now.");
      return;
    }

    this.activityService.immediateActivity = activity;
    this.mainLoopService.tick()
    this.activityService.immediateActivity = null;
  }

  rightClick(activity: Activity, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activityService.spiritActivity = activity.activityType;
  }

  drag(activity: Activity, event: DragEvent) {
    if (activity.projectionOnly || !activity.unlocked) {
      // don't allow projection only activities to drag and drop
      return;
    }
    event.dataTransfer?.setData('activity', '' + activity.activityType);
  }

  hellBoss() {
    this.hellService.fightHellBoss();
  }

  getActivityTooltip(activity: Activity, doNow = false) {
    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell) {
      return '';
    } else if (activity.unlocked) {
      if (doNow){
        return "Spend a day doing this activity";
      } else {
        let projectionString = '';
        if (this.characterService.characterState.manaUnlocked) {
          projectionString = '\nRight-click to set this as your spriritual projection activity';
        }
        return (
          'Add this activity to your schedule\n\nShift- or Ctrl-click to repeat it 10x\nShift-Ctrl-click to repeat it 100x\nAlt-click to add it to the top' +
          projectionString
        );
      }
    } else {
      return [
        'This activity is locked until you have the attributes required for it. You will need:\n',
        ...Object.entries(activity.requirements[0]).map(entry =>
          entry[1] ? `${this.camelToTitle.transform(entry[0])}: ${this.bigNumberPipe.transform(entry[1])}` : undefined
        ),
      ]
        .filter(line => line)
        .join('\n');
    }
  }

  showActivity(activity: Activity){
    let bodyString = activity.description[activity.level] + "\n\n" + activity.consequenceDescription[activity.level];
    if (activity.projectionOnly){
      bodyString +="\n\nThis activity can only be performed by a spiritual projection of yourself back in the mortal realm.";
    }

    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: { titleText: activity.name[activity.level], bodyText: bodyString },
      autoFocus: false,
    });

  }
}


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
import { CamelToTitlePipe } from '../app.component';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less']
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
    public dialog: MatDialog
  ) {
    this.Math = Math;
    this.character = characterService.characterState;
  }

  JoinTheGodsClick(){
    if (!confirm("Are you sure you are ready for this? You will need to leave all your money and most of your followers and possessions behind as you leave this mortal realm.")){
      return;
    }
    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '700px',
      data: {titleText: "Joining the Gods", bodyText: JoinTheGodsText}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.hellService.inHell = true;
      this.characterService.characterState.money = 0;
      this.inventoryService.stashInventory();
      this.followerService.hellPurge();
      this.activityService.reloadActivities();
    });
  }

  onClick(activity: Activity, event: MouseEvent): void {
    if (!activity.unlocked){
      return;
    }

    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell){
      // Hell transition activities fire immediately instead of adding to activityLoop
      activity.consequence[activity.level]();
      return;
    }

    if (activity.projectionOnly){
      this.activityService.spiritActivity = activity.activityType;
      return;
    }

    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1
    repeat *= event.shiftKey || event.altKey ? 10 : 1
    repeat *= event.ctrlKey || event.metaKey ? 10 : 1

    // Alt will put it at the top of the schedule, otherwise the bottom
    if (event.altKey) {
      this.activityService.activityLoop.unshift({
        activity: activity.activityType,
        repeatTimes: repeat
      });
    } else {
      this.activityService.activityLoop.push({
        activity: activity.activityType,
        repeatTimes: repeat
      });
    }
  }

  drag(activity: Activity, event: DragEvent){
    if (activity.projectionOnly || !activity.unlocked){
      // don't allow projection only activities to drag and drop
      return;
    }
    event.dataTransfer?.setData("activity", "" + activity.activityType);
  }

  hellBoss(){
    this.hellService.fightHellBoss();
  }

  getActivityTooltip(activity: Activity){
    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell){
      return "";
    } else if (activity.unlocked){
       return 'Add this to your schedule\n\nShift- or Ctrl-click to repeat it 10x\nShift-Ctrl-click to repeat it 100x\nAlt-click to add it to the top';
    } else {
      let requirementString = 'This activity is locked until you have the attributes required for it. You will need:\n\n';
      const requirements = activity.requirements[0];
      for (const prop in requirements){
        //@ts-ignore
        requirementString += this.camelToTitle.transform(prop) + ": " + requirements[prop] + "\n";
      }
      return requirementString;
    }
  }

}

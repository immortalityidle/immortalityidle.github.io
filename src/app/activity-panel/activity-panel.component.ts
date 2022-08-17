import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { Character } from '../game-state/character';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { JoinTheGodsText } from '../game-state/textResources';
import { InventoryService } from '../game-state/inventory.service';
import { FollowersService } from '../game-state/followers.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less']
})
export class ActivityPanelComponent {

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
    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '700px',
      data: {titleText: "Joining the Gods", bodyText: JoinTheGodsText}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.hellService.inHell = true;
      this.inventoryService.stashInventory();
      this.followerService.hellPurge();
      this.activityService.reloadActivities();
    });
  }

  onClick(activity: Activity, event: MouseEvent): void {
    if (!activity.unlocked){
      return;
    }
    if (activity.projectionOnly){
      this.activityService.spiritActivity = activity.activityType;
      return;
    }

    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1
    repeat *= event.shiftKey ? 10 : 1
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
}

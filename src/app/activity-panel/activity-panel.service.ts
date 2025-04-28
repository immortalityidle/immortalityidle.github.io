import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { joinTheGodsText } from '../game-state/textResources';
import { HellLevel, HellService } from '../game-state/hell.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';
import { FollowersService } from '../game-state/followers.service';
import { ActivityService } from '../game-state/activity.service';
import { Activity, ActivityType } from '../game-state/activity';
import { BattleService } from '../game-state/battle.service';
import { LogService, LogTopic } from '../game-state/log.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { BigNumberPipe, CamelToTitlePipe } from '../pipes';

@Injectable({
  providedIn: 'root',
})
export class ActivityPanelService {
  private activityService = inject(ActivityService);
  private battleService = inject(BattleService);
  private bigNumberPipe = inject(BigNumberPipe);
  private dialog = inject(MatDialog);
  private characterService = inject(CharacterService);
  private followersService = inject(FollowersService);
  private hellService = inject(HellService);
  private inventoryService = inject(InventoryService);
  private logService = inject(LogService);
  private mainLoopService = inject(MainLoopService);

  private camelToTitle = new CamelToTitlePipe();

  // TODO: Make this an activity
  public joinTheGodsClick() {
    if (
      !confirm(
        'Are you sure you are ready for this? You will need to leave all your money and most of your followers and possessions behind as you leave this mortal realm.'
      )
    ) {
      return;
    }
    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '700px',
      data: { titleText: 'Joining the Gods', bodyText: joinTheGodsText },
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(() => {
      this.hellService.inHell = true;
      this.hellService.moveToHell(HellLevel.Gates);
      this.characterService.money = 0;
      this.inventoryService.stashInventory();
      this.followersService.hellPurge();
      this.activityService.checkRequirements(true);
    });
  }

  public doActivity(activity: Activity) {
    if (this.battleService.enemies.length > 0) {
      // in a battle, bail out
      return;
    }
    if (!this.activityService.meetsRequirements(activity)) {
      this.logService.log(LogTopic.EVENT, activity.name[activity.level] + ' is unavailable now.');
      return;
    }
    const failedStatus = this.activityService.checkResourceUse(activity);
    if (failedStatus !== '') {
      this.characterService.flashStatus(failedStatus);
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

  public getActivityTooltip(activity: Activity, doNow = false) {
    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell) {
      return '';
    } else if (activity.unlocked) {
      if (doNow) {
        return 'Spend a day doing this activity';
      } else {
        let projectionString = '';
        if (this.characterService.qiUnlocked) {
          projectionString = '<br>Right-click to set this as your spriritual projection activity';
        }
        return (
          'Add this activity to your schedule<br>Shift- or Ctrl-click to repeat it 10x<br>Shift-Ctrl-click to repeat it 100x<br>Alt-click to add it to the top' +
          projectionString
        );
      }
    } else {
      let tooltipText = [
        'This activity is locked until you have the attributes required for it. You will need:<br>',
        ...Object.entries(activity.requirements[0]).map(entry =>
          entry[1] ? `${this.camelToTitle.transform(entry[0])}: ${this.bigNumberPipe.transform(entry[1])}` : undefined
        ),
      ]
        .filter(line => line)
        .join('<br>');
      if (activity.landRequirements) {
        tooltipText += '<br>Land: ' + activity.landRequirements;
      }
      if (activity.fallowLandRequirements) {
        tooltipText += '<br>Fallow Land: ' + activity.fallowLandRequirements;
      }
      if (activity.farmedLandRequirements) {
        tooltipText += '<br>Farmed Land: ' + activity.farmedLandRequirements;
      }
      return tooltipText;
    }
  }

  public showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
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

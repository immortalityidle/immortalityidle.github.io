import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { CharacterService } from '../game-state/character.service';
import { ActivityService } from '../game-state/activity.service';
import { Activity } from '../game-state/activity';
import { BattleService } from '../game-state/battle.service';
import { LogService, LogTopic } from '../game-state/log.service';
import { MainLoopService } from '../game-state/main-loop.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityPanelService {
  private activityService = inject(ActivityService);
  private battleService = inject(BattleService);
  private dialog = inject(MatDialog);
  private characterService = inject(CharacterService);
  private logService = inject(LogService);
  private mainLoopService = inject(MainLoopService);

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

  public showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    let bodyString = activity.description[activity.level] + '\n\n' + activity.consequenceDescription[activity.level];
    bodyString += this.activityService.getYinYangDescription(activity.yinYangEffect[activity.level]);
    if (activity.projectionOnly) {
      bodyString +=
        '\n\nThis activity can only be performed by a spiritual projection of yourself back in the mortal realm.';
    }

    const dialogProperties = {
      titleText: activity.name[activity.level],
      bodyTextArray: [bodyString],
      imageFiles: [''],
    };
    if (activity.imageBaseName) {
      dialogProperties.imageFiles = ['assets/images/activities/' + activity.imageBaseName + activity.level + '.png'];
    }
    this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: dialogProperties,
      autoFocus: false,
    });
  }
}

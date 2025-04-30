import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivityLoopEntry, ActivityType } from 'src/app/game-state/activity';
import { ActivityService } from 'src/app/game-state/activity.service';
import { BattleService } from 'src/app/game-state/battle.service';
import { CharacterService } from 'src/app/game-state/character.service';
import { MainLoopService } from 'src/app/game-state/main-loop.service';
import { BigNumberPipe } from 'src/app/pipes';
import { TextPanelComponent } from 'src/app/text-panel/text-panel.component';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';

@Component({
  selector: 'app-mobile-time',
  imports: [CommonModule, MatIconModule, TooltipDirective, BigNumberPipe],
  templateUrl: './mobile-time.component.html',
  styleUrl: './mobile-time.component.less',
})
//TODO: This is just pulled straight across. Needs to be made mobile friendly
export class MobileTimeComponent {
  protected readonly activityService = inject(ActivityService);
  protected readonly battleService = inject(BattleService);
  protected readonly characterService = inject(CharacterService);
  protected readonly mainLoopService = inject(MainLoopService);
  private dialog = inject(MatDialog);

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
    entry.userDisabled = !entry.userDisabled;
    if (!entry.userDisabled) {
      // make sure nothing that can't be enabled gets enabled
      this.activityService.checkRequirements(true);
    }
  }

  disableAllClick() {
    for (const entry of this.activityService.activityLoop) {
      entry.userDisabled = true;
    }
  }

  enableAllClick() {
    for (const entry of this.activityService.activityLoop) {
      entry.userDisabled = false;
    }
  }

  removeSpiritActivity() {
    this.activityService.spiritActivity = null;
  }

  useSavedTicks(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.useBankedTicks = event.target.checked;
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

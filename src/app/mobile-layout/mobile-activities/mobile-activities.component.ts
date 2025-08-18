import { Component, inject } from '@angular/core';
import { ActivityPanelService } from '../../activity-panel/activity-panel.service';
import { CharacterService } from 'src/app/game-state/character.service';
import { HellService } from 'src/app/game-state/hell.service';
import { ActivityService } from 'src/app/game-state/activity.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';
import { MainLoopService } from 'src/app/game-state/main-loop.service';
import { BattleService } from 'src/app/game-state/battle.service';
import { Activity } from 'src/app/game-state/activity';

@Component({
  selector: 'app-mobile-activities',
  imports: [CommonModule, MatIconModule, TooltipDirective],
  templateUrl: './mobile-activities.component.html',
  styleUrl: './mobile-activities.component.less',
})
export class MobileActivitiesComponent {
  protected Math = Math;

  protected activityService = inject(ActivityService);
  protected activityPanelService = inject(ActivityPanelService);
  protected battleService = inject(BattleService);
  protected characterService = inject(CharacterService);
  protected hellService = inject(HellService);
  protected mainLoopService = inject(MainLoopService);

  // TODO: This is directly copied, but needs to be tailored to a mobile layout
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

  // TODO: This is directly copied, but needs to be tailored to a mobile layout
  protected rightClick(activity: Activity, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activityService.spiritActivity = activity.activityType;
  }
}

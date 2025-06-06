import { Component, forwardRef, inject } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { TimeOptionsPanelComponent } from '../time-options-panel/time-options-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from '../game-state/game-state.service';
import { BattleService } from '../game-state/battle.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => NgClass),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class TimePanelComponent {
  protected activityService = inject(ActivityService);
  protected battleService = inject(BattleService);
  protected characterService = inject(CharacterService);
  protected mainLoopService = inject(MainLoopService);

  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(private gameStateService: GameStateService, private dialog: MatDialog) {}

  timeOptions() {
    this.dialog.open(TimeOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  useSavedTicks(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.useBankedTicks = event.target.checked;
  }
}

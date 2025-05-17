import { Component, forwardRef, inject } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { TimeOptionsPanelComponent } from '../time-options-panel/time-options-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from '../game-state/game-state.service';
import { BattleService } from '../game-state/battle.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass, DecimalPipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => NgClass),
    forwardRef(() => DecimalPipe),
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

  pauseClick() {
    if (this.mainLoopService.pause) {
      this.mainLoopService.tick();
    } else {
      this.mainLoopService.pause = true;
    }
  }

  slowClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 40;
  }

  standardClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 10;
  }

  fastClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 5;
  }

  fasterClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 2;
  }

  fastestClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 1;
  }

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

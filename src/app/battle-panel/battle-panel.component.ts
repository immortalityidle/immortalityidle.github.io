import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BattleOptionsPanelComponent } from '../battle-options-panel/battle-options-panel.component';
import { BattleService, Technique } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { MatIcon } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { BigNumberPipe } from '../app.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-battle-panel',
  templateUrl: './battle-panel.component.html',
  styleUrls: ['./battle-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class BattlePanelComponent {
  Math: Math;

  constructor(
    public battleService: BattleService,
    public characterService: CharacterService,
    public gameStateService: GameStateService,
    public mainLoopService: MainLoopService,
    public dialog: MatDialog
  ) {
    this.Math = Math;
    // only update the picture for the enemy every long tick for performance
  }

  battleOptions() {
    this.dialog.open(BattleOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  techniqueEnableChange(event: Event, technique: Technique) {
    if (!(event.target instanceof HTMLInputElement)) return;
    technique.disabled = !event.target.checked;
  }
}

import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BattleOptionsPanelComponent } from '../battle-options-panel/battle-options-panel.component';
import { BattleService } from '../game-state/battle.service';
import { MatIcon } from '@angular/material/icon';
import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-panel',
  templateUrl: './battle-panel.component.html',
  styleUrls: ['./battle-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
    forwardRef(() => NgOptimizedImage),
  ],
})
export class BattlePanelComponent {
  protected Math = Math;

  constructor(
    protected battleService: BattleService,
    protected characterService: CharacterService,
    private dialog: MatDialog
  ) {}

  protected battleOptions() {
    this.dialog.open(BattleOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  protected techniqueEnableChange(event: Event, techniqueIndex: number) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.battleService.techniques[techniqueIndex].disabled = !event.target.checked;
  }
}

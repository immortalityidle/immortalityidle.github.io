import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BattleOptionsPanelComponent } from '../battle-options-panel/battle-options-panel.component';
import { BattleService, Technique } from '../game-state/battle.service';
import { MatIcon } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

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
  protected Math = Math;

  constructor(protected battleService: BattleService, private dialog: MatDialog) {}

  protected battleOptions() {
    this.dialog.open(BattleOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  protected techniqueEnableChange(event: Event, technique: Technique) {
    if (!(event.target instanceof HTMLInputElement)) return;
    technique.disabled = !event.target.checked;
  }
}

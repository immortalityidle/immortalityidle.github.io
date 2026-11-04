import { Component, forwardRef } from '@angular/core';
import { BattleService, TechniqueDevelopmentEntry } from '../game-state/battle.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-technique-options-modal',
  imports: [forwardRef(() => TooltipDirective), MatIcon, MatDialogClose],
  templateUrl: './technique-options-modal.component.html',
  styleUrl: './technique-options-modal.component.less',
})
export class TechniqueOptionsModalComponent {
  constructor(public battleService: BattleService) {}

  entryToggled(event: Event, entry: TechniqueDevelopmentEntry) {
    if (!(event.target instanceof HTMLInputElement)) return;
    entry.allowed = event.target.checked;
  }
}

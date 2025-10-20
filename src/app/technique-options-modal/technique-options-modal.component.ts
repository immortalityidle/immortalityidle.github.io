import { Component, forwardRef } from '@angular/core';
import { BattleService, TechniqueDevelopmentEntry } from '../game-state/battle.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-technique-options-modal',
  imports: [forwardRef(() => TooltipDirective)],
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

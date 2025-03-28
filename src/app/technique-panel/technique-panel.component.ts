import { Component, forwardRef } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../app.component';

@Component({
  selector: 'app-technique-panel',
  imports: [forwardRef(() => TooltipDirective), forwardRef(() => CamelToTitlePipe)],
  templateUrl: './technique-panel.component.html',
  styleUrl: './technique-panel.component.less',
})
export class TechniquePanelComponent {
  constructor(public battleService: BattleService) {}
}

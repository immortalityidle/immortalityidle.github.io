import { Component, forwardRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { PantheonService } from '../game-state/pantheon.service';

@Component({
  selector: 'app-divine-duels-panel',
  imports: [forwardRef(() => MatIcon), forwardRef(() => TooltipDirective)],
  templateUrl: './divine-duels-panel.component.html',
  styleUrl: './divine-duels-panel.component.less',
})
export class DivineDuelsPanelComponent {
  protected Math = Math;

  constructor(protected pantheonService: PantheonService) {}
}

import { Component, forwardRef } from '@angular/core';
import { HellService } from '../game-state/hell.service';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-hell-status-panel',
  templateUrl: './hell-status-panel.component.html',
  styleUrl: './hell-status-panel.component.less',
  imports: [forwardRef(() => MatIcon), forwardRef(() => TooltipDirective)],
})
export class HellStatusPanelComponent {
  protected Math = Math;

  constructor(protected hellService: HellService) {}

  protected hellBoss() {
    this.hellService.fightHellBoss();
  }
}

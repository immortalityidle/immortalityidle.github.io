import { Component, forwardRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { Concept, ContemplationService } from '../game-state/contemplation.service';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-contemplation-panel',
  imports: [forwardRef(() => MatIcon), forwardRef(() => TooltipDirective), forwardRef(() => BigNumberPipe)],
  templateUrl: './contemplation-panel.component.html',
  styleUrl: './contemplation-panel.component.less',
})
export class ContemplationPanelComponent {
  constructor(public contemplationService: ContemplationService) {}

  conceptClicked(concept: Concept) {
    this.contemplationService.currentConcept = concept;
  }
}

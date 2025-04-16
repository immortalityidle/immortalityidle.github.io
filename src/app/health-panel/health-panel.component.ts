import { Component, forwardRef, inject } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { HomeService } from '../game-state/home.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass, DecimalPipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { HealthService } from './health.service';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less', '../app.component.less'],
  animations: [
    trigger('popupText', [
      state('in', style({ position: 'fixed' })),
      transition(':leave', [
        animate(
          1000,
          keyframes([style({ transform: 'translate(0%, 0%)' }), style({ transform: 'translate(0%, -150%)' })])
        ),
      ]),
    ]),
  ],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => NgClass),
    forwardRef(() => DecimalPipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class HealthPanelComponent {
  protected healthService = inject(HealthService);
  protected characterService = inject(CharacterService);
  protected homeService = inject(HomeService);

  protected Math = Math;

  protected animationDoneEvent() {
    while (this.healthService.moneyUpdates.length > 0) {
      this.healthService.moneyUpdates.pop();
    }
  }
}

import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CharacterService } from 'src/app/game-state/character.service';
import { HomeService } from 'src/app/game-state/home.service';
import { HealthService } from 'src/app/health-panel/health.service';
import { BigNumberPipe } from 'src/app/pipes';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';
import { YinYangComponent } from '../../health-panel/yin-yang/yin-yang.component';

@Component({
  selector: 'app-mobile-health',
  imports: [BigNumberPipe, CommonModule, MatIconModule, TooltipDirective, YinYangComponent],
  templateUrl: './mobile-health.component.html',
  styleUrl: './mobile-health.component.less',
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
})
export class MobileHealthComponent {
  protected characterService = inject(CharacterService);
  protected healthService = inject(HealthService);
  protected homeService = inject(HomeService);

  protected Math = Math;

  protected isCollapsed = false;

  protected animationDoneEvent() {
    while (this.healthService.moneyUpdates.length > 0) {
      this.healthService.moneyUpdates.pop();
    }
  }
}

import { Component, inject } from '@angular/core';
import { CharacterService } from 'src/app/game-state/character.service';
import { BigNumberPipe } from 'src/app/pipes';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';
import { HealthService } from '../health.service';

@Component({
  selector: 'app-yin-yang',
  imports: [TooltipDirective, BigNumberPipe],
  templateUrl: './yin-yang.component.html',
  styleUrl: './yin-yang.component.less',
})
export class YinYangComponent {
  protected characterService = inject(CharacterService);
  protected healthService = inject(HealthService);
}

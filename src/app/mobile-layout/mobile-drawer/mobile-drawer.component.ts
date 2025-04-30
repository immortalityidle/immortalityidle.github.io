import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonButtonsService } from 'src/app/common-buttons.service';
import { CharacterService } from 'src/app/game-state/character.service';
import { StoreService } from 'src/app/game-state/store.service';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';

@Component({
  selector: 'app-mobile-drawer',
  imports: [CommonModule, MatIconModule, TooltipDirective],
  templateUrl: './mobile-drawer.component.html',
  styleUrl: './mobile-drawer.component.less',
})
export class MobileDrawerComponent {
  protected readonly commonButtonsService = inject(CommonButtonsService);
  protected readonly characterService = inject(CharacterService);
  protected readonly storeService = inject(StoreService);
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonButtonsService } from 'src/app/common-buttons.service';
import { AchievementService } from 'src/app/game-state/achievement.service';
import { CharacterService } from 'src/app/game-state/character.service';
import { GameStateService } from 'src/app/game-state/game-state.service';
import { HellService } from 'src/app/game-state/hell.service';
import { MainLoopService } from 'src/app/game-state/main-loop.service';
import { StoreService } from 'src/app/game-state/store.service';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';

@Component({
  selector: 'app-mobile-drawer',
  imports: [CommonModule, MatIconModule, TooltipDirective],
  templateUrl: './mobile-drawer.component.html',
  styleUrl: './mobile-drawer.component.less',
})
export class MobileDrawerComponent {
  protected readonly gameStateService = inject(GameStateService);
  protected readonly commonButtonsService = inject(CommonButtonsService);
  protected readonly characterService = inject(CharacterService);
  protected readonly storeService = inject(StoreService);
  protected readonly mainLoopService = inject(MainLoopService);
  protected readonly hellService = inject(HellService);
  protected readonly achievementService = inject(AchievementService);
}

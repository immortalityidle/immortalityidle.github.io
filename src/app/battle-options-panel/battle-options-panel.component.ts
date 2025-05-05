import { Component, forwardRef } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { MatSelectModule } from '@angular/material/select';
import { InventoryService } from '../game-state/inventory.service';

@Component({
  selector: 'app-battle-options-panel',
  templateUrl: './battle-options-panel.component.html',
  styleUrls: ['./battle-options-panel.component.less', '../app.component.less'],
  imports: [forwardRef(() => MatSelectModule), forwardRef(() => TooltipDirective)],
})
export class BattleOptionsPanelComponent {
  constructor(
    protected battleService: BattleService,
    protected characterService: CharacterService,
    protected inventoryService: InventoryService
  ) {}

  potionThresholdChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.battleService.potionThreshold = Math.floor(parseFloat(event.target.value));
  }

  foodThresholdChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.battleService.foodThreshold = Math.floor(parseFloat(event.target.value));
  }
}

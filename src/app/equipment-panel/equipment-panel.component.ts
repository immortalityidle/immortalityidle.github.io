import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less']
})
export class EquipmentPanelComponent {
  character: Character;

  constructor(characterService: CharacterService,
    public inventoryService: InventoryService) {
    this.character = characterService.characterState;
  }
}

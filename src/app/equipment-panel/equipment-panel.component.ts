import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, instanceOfEquipment } from '../game-state/inventory.service';
import { ItemPrefixes } from '../game-state/itemResources';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less', '../app.component.less']
})
export class EquipmentPanelComponent {
  character: Character;

  constructor(characterService: CharacterService,
    public inventoryService: InventoryService) {
    this.character = characterService.characterState;
  }

  getSelectedItemSlot(){
    const item = this.inventoryService.selectedItem?.item;
    if (!item || !instanceOfEquipment(item)) {
      return null;
    }
    return item?.slot;
  }

}

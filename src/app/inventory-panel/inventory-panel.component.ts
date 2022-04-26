import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { EquipmentSlots } from '../game-state/character'
import { InventoryService, ItemStack } from '../game-state/inventory.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent {
  equipmentSlots: string[];
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
      this.equipmentSlots = Object.keys(this.characterService.characterState.equipment);
  }

  slotClicked(item: ItemStack){
    if (this.inventoryService.selectedItem == item){
      this.inventoryService.selectedItem = null;
    } else {
      this.inventoryService.selectedItem = item;
    }
  }

  sellAll(){
    if (this.inventoryService.selectedItem){
      this.sell(this.inventoryService.selectedItem.quantity);
    }
  }

  sell(quantity: number){
    if (this.inventoryService.selectedItem){
      this.inventoryService.sell(this.inventoryService.selectedItem, quantity);
      if (this.inventoryService.selectedItem.quantity == quantity){
        this.inventoryService.selectedItem = null;
      }
    }
  }

  use(){
    if (this.inventoryService.selectedItem){
      this.inventoryService.useItem(this.inventoryService.selectedItem);
    }
  }

  equip(){
    if (this.inventoryService.selectedItem){
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = null;
    }
  }
}

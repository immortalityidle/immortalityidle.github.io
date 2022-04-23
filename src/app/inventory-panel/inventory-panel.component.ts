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
  selectedItem: ItemStack | null = null;
  equipmentSlots: string[];
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
      this.equipmentSlots = Object.keys(this.characterService.characterState.equipment);
  }

  slotClicked(item: ItemStack){
    if (this.selectedItem == item){
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    console.log(this.selectedItem);
  }

  sellAll(){
    if (this.selectedItem){
      this.sell(this.selectedItem.quantity);
    }
  }

  sell(quantity: number){
    if (this.selectedItem){
      this.inventoryService.sell(this.selectedItem, quantity);
      if (this.selectedItem.quantity == quantity){
        this.selectedItem = null;
      }
    }
  }

  use(){
    if (this.selectedItem){
      this.inventoryService.useItem(this.selectedItem);
    }
  }

  equip(){
    if (this.selectedItem){
      this.inventoryService.equip(this.selectedItem);
      this.selectedItem = null;
    }
  }
}

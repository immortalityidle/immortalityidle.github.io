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

  slotClicked(item: ItemStack): void {
    if (this.inventoryService.selectedItem == item){
      this.inventoryService.selectedItem = null;
    } else {
      this.inventoryService.selectedItem = item;
    }
  }

  sellAll(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.sellAll(this.inventoryService.selectedItem.item);
    }
  }

  sellStack(){
    if (this.inventoryService.selectedItem){
      this.sell(this.inventoryService.selectedItem.quantity);
    }
  }

  sell(quantity: number): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.sell(this.inventoryService.selectedItem, quantity);
    }
  }

  use(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.useItem(this.inventoryService.selectedItem);
    }
  }

  equip(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = null;
    }
  }
}

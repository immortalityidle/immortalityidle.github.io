import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { EquipmentSlots } from '../game-state/character'
import { InventoryService, ItemStack } from '../game-state/inventory.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less', '../app.component.less']
})
export class InventoryPanelComponent {
  equipmentSlots: string[];
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
      this.equipmentSlots = Object.keys(this.characterService.characterState.equipment);
  }

  slotClicked(item: ItemStack, event: MouseEvent): void {
    event.preventDefault();
    if (event.shiftKey){
      this.inventoryService.selectedItem = item;
      this.use();
    } else if (event.ctrlKey){
      this.inventoryService.selectedItem = item;
      this.autoUse();
    } else {
      if (this.inventoryService.selectedItem == item){
        this.inventoryService.selectedItem = null;
      } else {
        this.inventoryService.selectedItem = item;
      }
    }
  }

  slotRightClicked(item: ItemStack, event: MouseEvent){
    event.preventDefault();
    this.inventoryService.selectedItem = item;
    if (event.ctrlKey){
      this.autoSell();
    } else if (event.shiftKey){
      this.sellStack();
    } else {
      this.sell(1);
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

  autoSell(){
    if (this.inventoryService.selectedItem){
      this.inventoryService.autoSell(this.inventoryService.selectedItem.item);
    }
  }

  use(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.useItemStack(this.inventoryService.selectedItem);
    }
  }

  autoUse(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.autoUse(this.inventoryService.selectedItem.item);
    }
  }

  autoBalance(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.autoBalance(this.inventoryService.selectedItem.item);
    }
  }

  equip(): void {
    if (this.inventoryService.selectedItem){
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = null;
    }
  }
}

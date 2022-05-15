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

  slotClicked(item: ItemStack | null, event: MouseEvent): void {
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

  slotRightClicked(item: ItemStack| null, event: MouseEvent){
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

  allowDrop(event: DragEvent){
    if (event.dataTransfer?.types[0] == "inventory"){
      event.preventDefault();
    }

    event.preventDefault();
  }

  drag(sourceIndex: number, event: DragEvent){
    event.dataTransfer?.setData("inventory", sourceIndex + "");
  }

  drop(destIndex: number, event: DragEvent){
    event.preventDefault();
    let sourceIndexString: string = event.dataTransfer?.getData("inventory") + "";
    let sourceIndex = parseInt(sourceIndexString);
    if (sourceIndex >= 0 && sourceIndex < this.inventoryService.itemStacks.length){
      let swapper = this.inventoryService.itemStacks[destIndex];
      this.inventoryService.itemStacks[destIndex] = this.inventoryService.itemStacks[sourceIndex];
      this.inventoryService.itemStacks[sourceIndex] = swapper;
    }
  }
}

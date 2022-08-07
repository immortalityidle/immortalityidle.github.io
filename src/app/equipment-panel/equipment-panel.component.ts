import { Component } from '@angular/core';
import { Character, EquipmentPosition } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, instanceOfEquipment, Item } from '../game-state/inventory.service';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less', '../app.component.less']
})
export class EquipmentPanelComponent {
  character: Character;

  constructor(private characterService: CharacterService,
    public inventoryService: InventoryService) {
    this.character = characterService.characterState;
  }

  slotDoubleClicked(slot: EquipmentPosition, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.characterService.characterState.equipment[slot];
    // check for existence and make sure there's an empty slot for it
    if (item && this.inventoryService.openInventorySlots() > 0){
      this.inventoryService.addItem(item as Item);
      this.characterService.characterState.equipment[slot] = null;
      this.inventoryService.selectedItem = null;
    }

  }

  getSelectedItemSlot(){
    const item = this.inventoryService.selectedItem?.item;
    if (!item || !instanceOfEquipment(item)) {
      return null;
    }
    return item?.slot;
  }

  allowDrop(event: DragEvent){
    if (event.dataTransfer?.types[0] === "inventory"){
      event.preventDefault();
    }
  }

  drag(slot: string, event: DragEvent){
    event.dataTransfer?.setData("equipment", slot);
  }

  drop(slot: string, event: DragEvent){
    event.preventDefault();
    const sourceIndexString: string = event.dataTransfer?.getData("inventory") + "";
    const sourceIndex = parseInt(sourceIndexString);
    if (sourceIndex >= 0 && sourceIndex < this.inventoryService.itemStacks.length){
      const itemToEquip = this.inventoryService.itemStacks[sourceIndex];
      const equipmentSlot: EquipmentPosition = slot as EquipmentPosition;
      if (itemToEquip){
        this.inventoryService.mergeEquippedSlot(equipmentSlot, itemToEquip.item, sourceIndex);
        this.inventoryService.selectedItem = null;
      }
    }
  }
}

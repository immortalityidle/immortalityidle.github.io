import { Component } from '@angular/core';
import { Character, EquipmentPosition } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, instanceOfEquipment, Item } from '../game-state/inventory.service';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less', '../app.component.less'],
})
export class EquipmentPanelComponent {
  character: Character;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    private characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService
  ) {
    this.character = characterService.characterState;
  }

  slotDoubleClicked(slot: EquipmentPosition, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.characterService.characterState.equipment[slot];
    // check for existence and make sure there's an empty slot for it
    if (item && this.inventoryService.openInventorySlots() > 0) {
      this.inventoryService.addItem(item as Item);
      this.characterService.characterState.equipment[slot] = null;
      this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
    }
  }

  getSelectedItemSlot() {
    const item = this.inventoryService.selectedItem?.item;
    if (!item || !instanceOfEquipment(item)) {
      return null;
    }
    return item?.slot;
  }

  dragStart() {
    this.gameStateService.dragging = true;
  }

  dragEnd() {
    this.gameStateService.dragging = false;
  }

  dragMoved(event: CdkDragMove) {
    this.dragPositionX = event.pointerPosition.x;
    this.dragPositionY = event.pointerPosition.y;
  }

  // this function feels super hacky and I kind of hate it, but it was the only way I could get the angular drag and drop stuff to do what I wanted
  dragReleased(event: CdkDragRelease) {
    let x: number;
    let y: number;
    if (event.event instanceof MouseEvent) {
      x = event.event.clientX;
      y = event.event.clientY;
    } else if (event.event instanceof TouchEvent) {
      x = this.dragPositionX;
      y = this.dragPositionY;
    } else {
      return;
    }

    const sourceItem = event.source.data;
    if (!sourceItem) {
      return;
    }

    let destinationItemIndex: number = -1;
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      if (element.id.startsWith('itemIndex')) {
        destinationItemIndex = parseInt(element.id.substring('itemIndex'.length));
      }
    }
    if (destinationItemIndex === -1) {
      return;
    }

    for (const element of elements) {
      if (element.id.startsWith('itemIndex')) {
        const destinationItemIndex = parseInt(element.id.substring('itemIndex'.length));
        if (destinationItemIndex >= 0 && destinationItemIndex < this.inventoryService.itemStacks.length) {
          const destinationItemStack = this.inventoryService.itemStacks[destinationItemIndex];
          if (destinationItemStack.item) {
            // there's something there, see if we can merge
            if (instanceOfEquipment(destinationItemStack.item) && destinationItemStack.item.slot === sourceItem.slot) {
              // clear out the destination slot and merge
              this.inventoryService.setItemEmptyStack(destinationItemIndex);
              this.inventoryService.mergeEquipment(destinationItemStack.item, sourceItem, destinationItemIndex);
              this.characterService.characterState.equipment[destinationItemStack.item.slot] = null;
            }
          } else {
            this.inventoryService.addItem(sourceItem as Item, 1, destinationItemIndex);
            const equipmentSlot: EquipmentPosition = sourceItem.slot as EquipmentPosition;
            this.characterService.characterState.equipment[equipmentSlot] = null;
          }
        }
      }
    }
  }

  getEffectClass(slot: string): string {
    let effect;
    if (slot === 'leftHand' || slot === 'rightHand') {
      effect = this.character.equipment[slot]?.weaponStats?.effect;
    } else if (slot === 'head' || slot === 'body' || slot === 'legs' || slot === 'feet') {
      effect = this.character.equipment[slot]?.armorStats?.effect;
    }
    if (effect) {
      return 'effect' + effect;
    }
    return '';
  }
}

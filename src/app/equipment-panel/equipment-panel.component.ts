import { Component, forwardRef } from '@angular/core';
import { CharacterService, EquipmentPosition } from '../game-state/character.service';
import { InventoryService, instanceOfEquipment, Item } from '../game-state/inventory.service';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => CdkDropList),
    forwardRef(() => CdkDrag),
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class EquipmentPanelComponent {
  private dragPositionX = 0;
  private dragPositionY = 0;

  constructor(
    public characterService: CharacterService,
    private inventoryService: InventoryService,
    private gameStateService: GameStateService
  ) {}

  protected slotDoubleClicked(slot: EquipmentPosition, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.characterService.equipment[slot];
    // check for existence and make sure there's an empty slot for it
    if (item && this.inventoryService.openInventorySlots() > 0) {
      this.inventoryService.addItem(item as Item);
      this.characterService.equipment[slot] = null;
      this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
    }
    this.inventoryService.updateDisplayValues();
  }

  protected pouchDoubleClicked(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const pouchItemStack = this.characterService.itemPouches[index];
    // check for existence and make sure there's an empty slot for it
    if (pouchItemStack && pouchItemStack.item && this.inventoryService.openInventorySlots() > 0) {
      this.inventoryService.addItem(pouchItemStack.item, pouchItemStack.quantity, 0, true);
      this.characterService.itemPouches[index] = this.inventoryService.getEmptyItemStack();
      this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
    }
    this.inventoryService.updateDisplayValues();
  }

  protected getSelectedItemSlot() {
    const item = this.inventoryService.selectedItem?.item;
    if (!item || !instanceOfEquipment(item)) {
      return null;
    }
    return item?.slot;
  }

  protected dragStart() {
    this.gameStateService.dragging = true;
  }

  protected dragEnd() {
    this.gameStateService.dragging = false;
  }

  protected dragMoved(event: CdkDragMove) {
    this.dragPositionX = event.pointerPosition.x;
    this.dragPositionY = event.pointerPosition.y;
  }

  // this function feels super hacky and I kind of hate it, but it was the only way I could get the angular drag and drop stuff to do what I wanted
  protected dragReleased(event: CdkDragRelease) {
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
              this.characterService.equipment[destinationItemStack.item.slot] = null;
            } else if (destinationItemStack.item.name === sourceItem.item?.name) {
              const pouchIndex = this.characterService.itemPouches.indexOf(sourceItem);
              if (pouchIndex !== -1) {
                destinationItemStack.quantity += sourceItem.quantity;
                this.inventoryService.fixId(destinationItemIndex);
                this.characterService.itemPouches[pouchIndex] = this.inventoryService.getEmptyItemStack();
              }
            }
          } else {
            if (sourceItem.quantity) {
              // it's a pouch stack
              const pouchIndex = this.characterService.itemPouches.indexOf(sourceItem);
              if (pouchIndex !== -1) {
                this.inventoryService.addItem(sourceItem.item, sourceItem.quantity, destinationItemIndex, true);
                this.characterService.itemPouches[pouchIndex] = this.inventoryService.getEmptyItemStack();
              }
            } else {
              this.inventoryService.addItem(sourceItem as Item, 1, destinationItemIndex);
              const equipmentSlot: EquipmentPosition = sourceItem.slot as EquipmentPosition;
              this.characterService.equipment[equipmentSlot] = null;
            }
          }
        }
      }
    }
    this.inventoryService.updateDisplayValues();
  }
}

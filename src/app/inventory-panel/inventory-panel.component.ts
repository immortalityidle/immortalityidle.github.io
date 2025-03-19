import { Component, forwardRef } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { EquipmentPosition } from '../game-state/character';
import { InventoryService, ItemStack, instanceOfEquipment } from '../game-state/inventory.service';
import { HellService } from '../game-state/hell.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { HomeService } from '../game-state/home.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => NgClass),
    forwardRef(() => CdkDropList),
    forwardRef(() => CdkDrag),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class InventoryPanelComponent {
  equipmentSlots: string[];
  instanceOfEquipment = instanceOfEquipment;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    public inventoryService: InventoryService,
    public characterService: CharacterService,
    private homeService: HomeService,
    public hellService: HellService,
    public mainLoopService: MainLoopService,
    public gameStateService: GameStateService
  ) {
    this.equipmentSlots = Object.keys(this.characterService.characterState.equipment);
  }

  isFinite(value: number) {
    return Number.isFinite(value);
  }

  slotClicked(item: ItemStack, event: MouseEvent): void {
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      let oldSelected = null;
      if (oldSelected !== item) {
        oldSelected = this.inventoryService.selectedItem;
      }
      this.inventoryService.selectedItem = item;
      this.use();
      this.inventoryService.selectedItem = oldSelected;
    } else if (event.ctrlKey || event.metaKey) {
      this.inventoryService.selectedItem = item;
      this.autoUse();
    } else {
      if (this.inventoryService.selectedItem === item) {
        this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
      } else {
        this.inventoryService.selectedItem = item;
      }
    }
  }

  slotDoubleClicked(item: ItemStack, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.inventoryService.selectedItem = item;
    if (this.inventoryService.selectedItem) {
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
    }
  }

  slotRightClicked(item: ItemStack, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.inventoryService.selectedItem = item;
    if (event.ctrlKey || event.metaKey) {
      this.autoSell();
    } else if (event.shiftKey || event.altKey) {
      this.sellStack();
    } else {
      this.sell(1);
    }
  }

  sortClicked(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
      this.inventoryService.descendingSort = !this.inventoryService.descendingSort;
    } else if (event.shiftKey || event.altKey) {
      this.inventoryService.autoSort = !this.inventoryService.autoSort;
    } else {
      this.inventoryService.sortInventory();
    }
  }

  sellAll(): void {
    if (this.inventoryService.selectedItem?.item) {
      this.inventoryService.sellAll(this.inventoryService.selectedItem.item);
    }
  }

  sellStack() {
    if (this.inventoryService.selectedItem) {
      this.sell(this.inventoryService.selectedItem.quantity);
    }
  }

  sell(quantity: number): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.sell(this.inventoryService.selectedItem, quantity);
    }
  }

  autoSell() {
    if (this.inventoryService.selectedItem?.item) {
      this.inventoryService.autoSell(this.inventoryService.selectedItem.item);
    }
  }

  use(event: MouseEvent | null = null): void {
    let quantity = 1;
    if (event) {
      if (event.shiftKey) {
        quantity *= 10;
      }
      if (event.ctrlKey) {
        quantity *= 100;
      }
    }
    if (this.inventoryService.selectedItem) {
      this.inventoryService.useItemStack(this.inventoryService.selectedItem, quantity);
    }
  }

  autoUse(): void {
    if (this.inventoryService.selectedItem?.item) {
      this.inventoryService.autoUse(this.inventoryService.selectedItem.item);
    }
  }

  autoBalance(): void {
    if (this.inventoryService.selectedItem?.item) {
      this.inventoryService.autoBalance(this.inventoryService.selectedItem.item);
    }
  }

  equip(): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
    }
  }

  mergeSpiritGem() {
    if (this.inventoryService.selectedItem) {
      // if I'm manually doing a gem merge, I don't want the rest of the stack to be automatically sold
      this.inventoryService.autoSellOldGemsEnabled = false;
      this.inventoryService.mergeSpiritGem(this.inventoryService.selectedItem);
      if (this.inventoryService.selectedItem.quantity === 0) {
        this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
      }
    }
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

    let sourceItemIndex = -1;
    for (let i = 0; i < this.inventoryService.itemStacks.length; i++) {
      if (event.source.data === this.inventoryService.itemStacks[i]) {
        sourceItemIndex = i;
      }
    }
    if (sourceItemIndex === -1) {
      return;
    }
    const itemStack = this.inventoryService.itemStacks[sourceItemIndex];
    if (!itemStack.item) {
      return;
    }

    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      if (element.id.startsWith('itemIndex')) {
        const destinationItemIndex = parseInt(element.id.substring('itemIndex'.length));
        if (destinationItemIndex === sourceItemIndex) {
          return;
        }
        this.mergeOrSwapStacks(sourceItemIndex, destinationItemIndex);
        this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
      } else if (element.id.startsWith('pouchIndex')) {
        const destinationPouchIndex = parseInt(element.id.substring('pouchIndex'.length));
        this.inventoryService.moveToPouch(sourceItemIndex, destinationPouchIndex);
      } else if (element.id.startsWith('wsInputIndex')) {
        //id="wsInputIndex{{workstation.index}}_{{$index}}"
        const indexParts = element.id.substring('wsInputIndex'.length).split('_');
        if (indexParts.length !== 2) {
          // didn't get two parts, bail out
          return;
        }
        const destinationWorkstationIndex = parseInt(indexParts[0]);
        const destinationInputIndex = parseInt(indexParts[1]);
        this.homeService.moveItemToWorkstation(sourceItemIndex, destinationWorkstationIndex, destinationInputIndex);
      } else if (element.id.startsWith('equipmentSlot')) {
        const equipmentSlotString = element.id.substring('equipmentSlot'.length);
        const slot: EquipmentPosition = equipmentSlotString as EquipmentPosition;
        if (!this.characterService.characterState.equipment[slot]) {
          this.inventoryService.equip(itemStack);
          this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
        } else {
          if (!instanceOfEquipment(itemStack.item) || itemStack.item.slot === slot) {
            this.inventoryService.mergeEquippedSlot(slot, itemStack.item, sourceItemIndex);
            this.inventoryService.selectedItem = this.inventoryService.getEmptyItemStack();
          }
        }
      }
    }
  }

  mergeOrSwapStacks(sourceIndex: number, destIndex: number) {
    if (sourceIndex >= 0 && sourceIndex < this.inventoryService.itemStacks.length) {
      const sourceItemStack = this.inventoryService.itemStacks[sourceIndex];
      const destItemStack = this.inventoryService.itemStacks[destIndex];
      const sourceItem = sourceItemStack?.item;
      const destItem = destItemStack?.item;
      if (sourceItem && destItem) {
        if (instanceOfEquipment(sourceItem) && instanceOfEquipment(destItem)) {
          if (sourceItem.slot === destItem.slot) {
            this.inventoryService.setItemEmptyStack(destIndex);
            this.inventoryService.setItemEmptyStack(sourceIndex);
            this.inventoryService.mergeEquipment(destItem, sourceItem, destIndex);
            return;
          }
        } else if (sourceItem.type === 'gem' && instanceOfEquipment(destItem)) {
          this.inventoryService.gemifyEquipment(sourceIndex, destItem);
          return;
        } else if (sourceItem.name === destItem.name) {
          this.inventoryService.mergeItemStacks(sourceItemStack, destItemStack, sourceIndex, destIndex);
        } else {
          // it wasn't a merge, just swap their positions
          this.inventoryService.itemStacks[destIndex] = sourceItemStack;
          this.inventoryService.itemStacks[sourceIndex] = destItemStack;
          // fix the ids to use the new indices
          this.inventoryService.fixId(destIndex);
          this.inventoryService.fixId(sourceIndex);
        }
      } else {
        // it wasn't a merge, just swap their positions
        this.inventoryService.itemStacks[destIndex] = sourceItemStack;
        this.inventoryService.itemStacks[sourceIndex] = destItemStack;
      }
    }
  }

  throwAway() {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.removeItemStack(this.inventoryService.selectedItem);
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  getStyle(itemStack: ItemStack): { [klass: string]: any } {
    if (itemStack) {
      if (itemStack.item) {
        if (itemStack.item.imageColor) {
          return { 'border-color': itemStack.item.imageColor, border: 'solid 1px' };
        }
      }
    }
    return { 'border-color': 'white', border: 'solid 1px' };
  }
}

import { Component } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes, AnimationEvent } from '@angular/animations';
import { CharacterService } from '../game-state/character.service';
import { EquipmentPosition } from '../game-state/character';
import { InventoryService, ItemStack, Item, instanceOfEquipment } from '../game-state/inventory.service';
import { HellService } from '../game-state/hell.service';
import { MainLoopService } from '../game-state/main-loop.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less', '../app.component.less'],
  animations: [ 
    trigger('popupText', [
      state('in', style({ position:"fixed"  })),
      transition(":leave", [
        animate(
          1000,
          keyframes([
            style({ transform: 'translate(0%, 0%)' }),
            style({ transform: 'translate(0%, -150%)' }),
          ])
        )
      ]),
    ])
  ]
})
export class InventoryPanelComponent {
  equipmentSlots: string[];
  instanceOfEquipment = instanceOfEquipment;
  popupCounter = 0;

  constructor(
    public inventoryService: InventoryService,
    public characterService: CharacterService,
    public hellService: HellService,
    public mainLoopService: MainLoopService
  ) {
    this.equipmentSlots = Object.keys(this.characterService.characterState.equipment);
    this.moneyUpdates = [];
    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.popupCounter < 1){
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      if (this.characterService.characterState.moneyUpdates != 0){
        this.moneyUpdates.push(this.characterService.characterState.moneyUpdates);
        this.characterService.characterState.moneyUpdates = 0;
      }
    });

  }

  moneyUpdates: number[];

  isFinite(value: number) {
    return Number.isFinite(value);
  }

  slotClicked(item: ItemStack | null, event: MouseEvent): void {
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
        this.inventoryService.selectedItem = null;
      } else {
        this.inventoryService.selectedItem = item;
      }
    }
  }

  slotDoubleClicked(item: ItemStack | null, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.inventoryService.selectedItem = item;
    if (this.inventoryService.selectedItem) {
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = null;
    }
  }

  slotRightClicked(item: ItemStack | null, event: MouseEvent) {
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
    if (this.inventoryService.selectedItem) {
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
    if (this.inventoryService.selectedItem) {
      this.inventoryService.autoSell(this.inventoryService.selectedItem.item);
    }
  }

  use(): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.useItemStack(this.inventoryService.selectedItem);
    }
  }

  autoUse(): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.autoUse(this.inventoryService.selectedItem.item);
    }
  }

  autoBalance(): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.autoBalance(this.inventoryService.selectedItem.item);
    }
  }

  equip(): void {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.equip(this.inventoryService.selectedItem);
      this.inventoryService.selectedItem = null;
    }
  }

  mergeSpiritGem() {
    if (this.inventoryService.selectedItem) {
      // if I'm manually doing a gem merge, I don't want the rest of the stack to be automatically sold
      this.inventoryService.autoSellOldGemsEnabled = false;
      this.inventoryService.mergeSpiritGem(this.inventoryService.selectedItem);
      if (this.inventoryService.selectedItem.quantity === 0) {
        this.inventoryService.selectedItem = null;
      }
    }
  }

  allowDrop(event: DragEvent) {
    if (event.dataTransfer?.types[0] === 'inventory' || event.dataTransfer?.types[0] === 'equipment') {
      event.preventDefault();
    }
  }

  drag(sourceIndex: number, event: DragEvent) {
    this.inventoryService.selectedItem = this.inventoryService.itemStacks[sourceIndex];
    event.dataTransfer?.setData('inventory', sourceIndex + '');
  }

  drop(destIndex: number, event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.types[0] === 'inventory') {
      const sourceIndexString: string = event.dataTransfer?.getData('inventory') + '';
      const sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex === destIndex) {
        return;
      }
      if (sourceIndex >= 0 && sourceIndex < this.inventoryService.itemStacks.length) {
        const sourceItemStack = this.inventoryService.itemStacks[sourceIndex];
        const destItemStack = this.inventoryService.itemStacks[destIndex];
        const sourceItem = sourceItemStack?.item;
        const destItem = destItemStack?.item;
        if (sourceItem && destItem) {
          if (instanceOfEquipment(sourceItem) && instanceOfEquipment(destItem)) {
            if (sourceItem.slot === destItem.slot) {
              this.inventoryService.itemStacks[destIndex] = null;
              this.inventoryService.itemStacks[sourceIndex] = null;
              this.inventoryService.selectedItem = null;
              this.inventoryService.mergeEquipment(destItem, sourceItem, destIndex);
              return;
            }
          } else if (sourceItem.type.includes('Gem') && instanceOfEquipment(destItem)) {
            this.inventoryService.gemifyEquipment(sourceIndex, destItem);
            return;
          } else if (sourceItem.name === destItem.name) {
            this.inventoryService.mergeItemStacks(sourceItemStack, destItemStack, sourceIndex);
          } else {
            // it wasn't a merge, just swap their positions
            this.inventoryService.itemStacks[destIndex] = sourceItemStack;
            this.inventoryService.itemStacks[sourceIndex] = destItemStack;
          }
        } else {
          // it wasn't a merge, just swap their positions
          this.inventoryService.itemStacks[destIndex] = sourceItemStack;
          this.inventoryService.itemStacks[sourceIndex] = destItemStack;
        }
      }
    } else if (event.dataTransfer?.types[0] === 'equipment') {
      //unequiping something
      const slot: EquipmentPosition = (event.dataTransfer?.getData('equipment') + '') as EquipmentPosition;
      const item = this.characterService.characterState.equipment[slot];
      // check for existence and make sure there's an empty slot for it
      if (item && this.inventoryService.openInventorySlots() > 0) {
        this.inventoryService.addItem(item as Item);
        this.characterService.characterState.equipment[slot] = null;
        this.inventoryService.selectedItem = null;
      }
    }
  }

  throwAway() {
    if (this.inventoryService.selectedItem) {
      this.inventoryService.removeItemStack(this.inventoryService.selectedItem);
    }
  }

  animationDoneEvent(event: AnimationEvent){
    while (this.moneyUpdates.length > 0){
      this.moneyUpdates.pop();
    }
  }

  getMoneyUpdates(): number[] {
    return this.moneyUpdates;
  }

}

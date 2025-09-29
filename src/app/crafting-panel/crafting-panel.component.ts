import { Component, forwardRef } from '@angular/core';
import { HomeService, Workstation } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { HellService } from '../game-state/hell.service';
import { GameStateService } from '../game-state/game-state.service';
import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { CdkDragMove, CdkDragRelease, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { InventoryService } from '../game-state/inventory.service';
import { WorkstationSelectionModalComponent } from '../workstation-selection-modal/workstation-selection-modal.component';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CraftingOptionsModalComponent } from '../crafting-options-modal/crafting-options-modal.component';
import { BigNumberPipe, CamelToTitlePipe } from '../pipes';

@Component({
  selector: 'app-crafting-panel',
  templateUrl: './crafting-panel.component.html',
  styleUrls: ['./crafting-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => CdkDropList),
    forwardRef(() => CdkDrag),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
    forwardRef(() => NgOptimizedImage),
  ],
})
export class CraftingPanelComponent {
  protected Math = Math;

  private dragPositionX = 0;
  private dragPositionY = 0;

  constructor(
    protected homeService: HomeService,
    protected hellService: HellService,
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private gameStateService: GameStateService
  ) {}

  protected craftingOptions() {
    this.dialog.open(CraftingOptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  protected inputDoubleClicked(workstation: Workstation, inputSlot: number) {
    const inputItem = workstation.inputs[inputSlot].item;
    if (inputItem) {
      if (workstation.inputs[inputSlot].quantity > 0) {
        this.inventoryService.addItem(inputItem, workstation.inputs[inputSlot].quantity, 0, true);
      }
      workstation.inputs[inputSlot] = this.inventoryService.getEmptyItemStack();
    }
  }

  protected addWorkstation() {
    this.dialog.open(WorkstationSelectionModalComponent, {
      width: '600px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
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
    let sourceWorkstation = null;
    let inputIndex = -1;
    for (const workstation of this.homeService.workstations) {
      for (let i = 0; i < workstation.inputs.length; i++) {
        if (workstation.inputs[i] === sourceItem) {
          sourceWorkstation = workstation;
          inputIndex = i;
        }
      }
    }
    if (!sourceWorkstation || inputIndex === -1) {
      // couldn't find the source, bail out
      return;
    }

    if (sourceWorkstation.inputs[inputIndex].quantity === 0) {
      // the stack is empty, so destination doesn't matter. Clear it and bail out.
      sourceWorkstation.inputs[inputIndex] = this.inventoryService.getEmptyItemStack();
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
            if (destinationItemStack.item.name === sourceItem.item?.name) {
              destinationItemStack.quantity += sourceItem.quantity;
              this.inventoryService.fixId(destinationItemIndex);
              sourceWorkstation.inputs[inputIndex] = this.inventoryService.getEmptyItemStack();
            }
          } else {
            this.inventoryService.addItem(sourceItem.item, sourceItem.quantity, destinationItemIndex, true);
            sourceWorkstation.inputs[inputIndex] = this.inventoryService.getEmptyItemStack();
          }
        }
      }
    }
    this.inventoryService.updateDisplayValues();
  }
}

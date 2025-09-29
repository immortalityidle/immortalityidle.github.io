import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { CharacterService } from '../game-state/character.service';
import { FollowersService, Follower } from '../game-state/followers.service';
import { GameStateService } from '../game-state/game-state.service';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe, CamelToTitlePipe } from '../pipes';
import { InventoryService } from '../game-state/inventory.service';
import { CdkDrag, CdkDragMove, CdkDragRelease, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-followers-panel',
  templateUrl: './followers-panel.component.html',
  styleUrls: ['./followers-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
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
export class FollowersPanelComponent {
  popupCounter = 0;
  private dragPositionX = 0;
  private dragPositionY = 0;

  constructor(
    public characterService: CharacterService,
    public dialog: MatDialog,
    public gameStateService: GameStateService,
    public followerService: FollowersService,
    public inventoryService: InventoryService
  ) {}

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  followerOptionsClicked(): void {
    this.dialog.open(FollowerManagementPanelComponent, {
      width: '700px',
      data: { pets: false },
      autoFocus: false,
    });
  }

  dismissFollower(event: MouseEvent, follower: Follower) {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && this.followerService.autoDismissUnlocked) {
      this.followerService.limitFollower(follower);
    } else if (event.shiftKey && this.followerService.autoDismissUnlocked) {
      this.followerService.dismissAllFollowers(follower);
    } else {
      this.followerService.dismissFollower(follower);
    }
  }

  protected inputDoubleClicked(inputSlot: number) {
    const inputItem = this.followerService.hqInputs[inputSlot].item;
    if (inputItem) {
      if (this.followerService.hqInputs[inputSlot].quantity > 0) {
        this.inventoryService.addItem(inputItem, this.followerService.hqInputs[inputSlot].quantity, 0, true);
      }
      this.followerService.hqInputs[inputSlot] = this.inventoryService.getEmptyItemStack();
    }
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
    let inputIndex = -1;
    for (let i = 0; i < this.followerService.hqInputs.length; i++) {
      if (this.followerService.hqInputs[i] === sourceItem) {
        inputIndex = i;
      }
    }
    if (inputIndex === -1) {
      // couldn't find the source, bail out
      return;
    }

    if (this.followerService.hqInputs[inputIndex].quantity === 0) {
      // the stack is empty, so destination doesn't matter. Clear it and bail out.
      this.followerService.hqInputs[inputIndex] = this.inventoryService.getEmptyItemStack();
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
              this.followerService.hqInputs[inputIndex] = this.inventoryService.getEmptyItemStack();
            }
          } else {
            this.inventoryService.addItem(sourceItem.item, sourceItem.quantity, destinationItemIndex, true);
            this.followerService.hqInputs[inputIndex] = this.inventoryService.getEmptyItemStack();
          }
        }
      }
    }
    this.inventoryService.updateDisplayValues();
  }
}

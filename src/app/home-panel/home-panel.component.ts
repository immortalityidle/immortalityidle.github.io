import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService, Workstation } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FollowersService } from '../game-state/followers.service';
import { BigNumberPipe } from '../app.component';
import { HellService } from '../game-state/hell.service';
import { GameStateService } from '../game-state/game-state.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { TitleCasePipe } from '@angular/common';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { InventoryService } from '../game-state/inventory.service';
import { WorkstationSelectionModalComponent } from '../workstation-selection-modal/workstation-selection-modal.component';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
  standalone: false,
})
export class HomePanelComponent {
  character: Character;
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    public characterService: CharacterService,
    public homeService: HomeService,
    public followerService: FollowersService,
    public hellService: HellService,
    private inventoryService: InventoryService,
    public dialog: MatDialog,
    private storeService: StoreService,
    public gameStateService: GameStateService,
    private bignumber: BigNumberPipe,
    private titleCasePipe: TitleCasePipe
  ) {
    this.character = characterService.characterState;
    this.Math = Math;
  }

  buildTimeYears(): string {
    const builderPower = 1 + this.followerService.jobs['builder'].totalPower;
    return (
      this.bignumber.transform(
        ((1 - this.homeService.houseBuildingProgress) * this.homeService.nextHome.daysToBuild) / builderPower / 365
      ) + ' years'
    );
  }

  selectFurniture(furnitureIndex: number) {
    if (this.homeService.bedroomFurniture[furnitureIndex]) {
      this.homeService.setFurniture(null, furnitureIndex);
    } else {
      this.storeService.setFurnitureIndex(furnitureIndex);
      this.dialog.open(FurnitureStoreModalComponent, {
        width: '600px',
        data: { someField: 'foo' },
        autoFocus: false,
      });
    }
  }

  getFurnitureTooltip(furnitureIndex: number) {
    const item = this.homeService.bedroomFurniture[furnitureIndex];
    let tooltip = '';
    if (item === null) {
      if (this.homeService.seeFurnitureEffects) {
        tooltip += 'This space facilitates the Feng Shui of your home when its furniture aligns with:';
        for (const prop of this.homeService.baguaMap[furnitureIndex]) {
          tooltip += '<br>' + this.titleCasePipe.transform(prop);
        }
        tooltip += '<br>';
      }
      if (this.homeService.openBedroomFurnitureSlots > 0) {
        tooltip += 'Click to set which furniture should be placed here.';
      }
      return tooltip;
    }
    tooltip = item.description;
    if (this.homeService.seeFurnitureEffects) {
      tooltip += '<br>Feng Shui Properties:';
      if (item.subtype) {
        tooltip += '<br>' + this.titleCasePipe.transform(item.subtype);
      }
      if (item.color) {
        tooltip += '<br>Color: ' + this.titleCasePipe.transform(item.color);
      }
      if (item.elements) {
        tooltip += '<br>Elements: ';
        for (const element of item.elements) {
          tooltip += this.titleCasePipe.transform(element) + ', ';
        }
        tooltip = tooltip.substring(0, tooltip.length - 2);
      }
    }
    return tooltip;
  }

  inputDoubleClicked(workstation: Workstation, inputSlot: number, event: MouseEvent) {
    console.log(workstation, inputSlot, event);
  }

  addWorkstation() {
    this.dialog.open(WorkstationSelectionModalComponent, {
      width: '600px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
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
            this.inventoryService.addItem(sourceItem.item, sourceItem.quantity, destinationItemIndex);
            sourceWorkstation.inputs[inputIndex] = this.inventoryService.getEmptyItemStack();
          }
        }
      }
    }
  }
}

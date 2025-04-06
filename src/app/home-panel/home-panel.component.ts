import { Component, forwardRef } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FollowersService } from '../game-state/followers.service';
import { BigNumberPipe } from '../app.component';
import { HellService } from '../game-state/hell.service';
import { GameStateService } from '../game-state/game-state.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { TitleCasePipe, NgClass } from '@angular/common';
import { InventoryService } from '../game-state/inventory.service';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
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
}

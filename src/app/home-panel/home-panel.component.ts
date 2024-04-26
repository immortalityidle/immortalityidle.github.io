import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { FarmPanelComponent } from '../farm-panel/farm-panel.component';
import { FollowersService } from '../game-state/followers.service';
import { BigNumberPipe } from '../app.component';
import { HellService } from '../game-state/hell.service';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
})
export class HomePanelComponent {
  character: Character;
  Math: Math;

  constructor(
    public characterService: CharacterService,
    public homeService: HomeService,
    public followerService: FollowersService,
    public hellService: HellService,
    public dialog: MatDialog,
    private storeService: StoreService,
    public gameStateService: GameStateService,
    private bignumber: BigNumberPipe
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

  storeClicked(): void {
    this.storeService.setStoreInventory();
    this.dialog.open(FurnitureStoreModalComponent, {
      width: '600px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  farmClicked(): void {
    this.storeService.setStoreInventory();
    this.dialog.open(FarmPanelComponent, {
      width: '800px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  buyClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      this.homeService.buyLand(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.buyLand(-1);
    } else {
      this.homeService.buyLand(1);
    }
  }

  plowClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      this.homeService.addField(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.addField(-1);
    } else {
      this.homeService.addField();
    }
  }
}

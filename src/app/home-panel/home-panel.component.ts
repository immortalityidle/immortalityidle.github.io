import { Component, forwardRef } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FollowersService } from '../game-state/followers.service';
import { HellService } from '../game-state/hell.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class HomePanelComponent {
  protected Math = Math;

  constructor(
    protected characterService: CharacterService,
    protected homeService: HomeService,
    private followerService: FollowersService,
    protected hellService: HellService,
    private dialog: MatDialog,
    private storeService: StoreService,
    private bignumber: BigNumberPipe
  ) {}

  protected buildTimeYears(): string {
    const builderPower = 1 + this.followerService.jobs['builder'].totalPower;
    return (
      this.bignumber.transform(
        ((1 - this.homeService.houseBuildingProgress) * this.homeService.nextHome.daysToBuild) / builderPower / 365
      ) + ' years'
    );
  }

  protected selectFurniture(furnitureIndex: number) {
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

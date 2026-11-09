import { Component, forwardRef, inject } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FollowersService } from '../game-state/followers.service';
import { HellService } from '../game-state/hell.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';
import { AppService } from '../app.service';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
  imports: [
    CommonModule,
    MatIcon,
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class HomePanelComponent {
  protected Math = Math;

  protected appService = inject(AppService);

  constructor(
    protected characterService: CharacterService,
    protected homeService: HomeService,
    private followerService: FollowersService,
    protected hellService: HellService,
    private dialog: MatDialog,
    private storeService: StoreService,
    private bignumber: BigNumberPipe
  ) {}

  protected selectFurniture(furnitureIndex: number) {
    if (this.homeService.bedroomFurniture[furnitureIndex]) {
      this.homeService.setFurniture(null, furnitureIndex);
    } else {
      this.storeService.setFurnitureIndex(furnitureIndex);
      this.dialog.open(FurnitureStoreModalComponent, {
        width: this.appService.isMobile() ? '100vw' : '600px',
        maxWidth: this.appService.isMobile() ? '100vw' : '600px',
        maxHeight: '100vh',
        data: { someField: 'foo' },
        autoFocus: false,
      });
    }
  }
}

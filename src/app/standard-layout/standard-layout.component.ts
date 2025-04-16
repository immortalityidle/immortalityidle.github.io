import { Component, forwardRef, inject, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  KtdGridComponent,
  KtdGridItemComponent,
  KtdGridDragHandle,
  KtdGridLayoutItem,
  KtdGridLayout,
} from '@katoid/angular-grid-layout';
import { ActivityPanelComponent } from '../activity-panel/activity-panel.component';
import { AttributesPanelComponent } from '../attributes-panel/attributes-panel.component';
import { BattlePanelComponent } from '../battle-panel/battle-panel.component';
import { CraftingPanelComponent } from '../crafting-panel/crafting-panel.component';
import { EquipmentPanelComponent } from '../equipment-panel/equipment-panel.component';
import { FarmPanelComponent } from '../farm-panel/farm-panel.component';
import { FollowersPanelComponent } from '../followers-panel/followers-panel.component';
import { HealthPanelComponent } from '../health-panel/health-panel.component';
import { HomePanelComponent } from '../home-panel/home-panel.component';
import { ImpossibleTaskPanelComponent } from '../impossible-task-panel/impossible-task-panel.component';
import { InventoryPanelComponent } from '../inventory-panel/inventory-panel.component';
import { LocationPanelComponent } from '../location-panel/location-panel.component';
import { LogPanelComponent } from '../log-panel/log-panel.component';
import { PetsPanelComponent } from '../pets-panel/pets-panel.component';
import { PortalPanelComponent } from '../portal-panel/portal-panel.component';
import { TechniquePanelComponent } from '../technique-panel/technique-panel.component';
import { TimePanelComponent } from '../time-panel/time-panel.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { GameStateService } from '../game-state/game-state.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangelogPanelComponent } from '../changelog-panel/changelog-panel.component';
import { environment } from 'src/environments/environment';
import { TutorialPanelComponent } from '../tutorial-panel/tutorial-panel.component';
import { AchievementPanelComponent } from '../achievement-panel/achievement-panel.component';
import { StatisticsPanelComponent } from '../statistics-panel/statistics-panel.component';
import { AscensionStoreModalComponent } from '../ascension-store-modal/ascension-store-modal.component';
import { ManualStoreModalComponent } from '../manual-store-modal/manual-store-modal.component';
import { OptionsModalComponent } from '../options-modal/options-modal.component';
import { StoreModalComponent } from '../store-modal/store-modal.component';
import { StoreService } from '../game-state/store.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-standard-layout',
  imports: [
    CommonModule,
    MatIconModule,
    forwardRef(() => KtdGridComponent),
    forwardRef(() => KtdGridItemComponent),
    forwardRef(() => KtdGridDragHandle),
    forwardRef(() => TimePanelComponent),
    forwardRef(() => AttributesPanelComponent),
    forwardRef(() => HealthPanelComponent),
    forwardRef(() => ActivityPanelComponent),
    forwardRef(() => BattlePanelComponent),
    forwardRef(() => EquipmentPanelComponent),
    forwardRef(() => HomePanelComponent),
    forwardRef(() => InventoryPanelComponent),
    forwardRef(() => LogPanelComponent),
    forwardRef(() => PortalPanelComponent),
    forwardRef(() => FollowersPanelComponent),
    forwardRef(() => PetsPanelComponent),
    forwardRef(() => FarmPanelComponent),
    forwardRef(() => LocationPanelComponent),
    forwardRef(() => ImpossibleTaskPanelComponent),
    forwardRef(() => TechniquePanelComponent),
    forwardRef(() => CraftingPanelComponent),
    forwardRef(() => TooltipDirective),
  ],
  templateUrl: './standard-layout.component.html',
  styleUrl: './standard-layout.component.less',
})
export class StandardLayoutComponent {
  private readonly dialog = inject(MatDialog);
  protected readonly gameStateService = inject(GameStateService);
  protected readonly storeService = inject(StoreService);
  protected readonly characterService = inject(CharacterService);
  protected readonly document: Document = inject(DOCUMENT);

  public grid = viewChild.required(KtdGridComponent);

  protected applicationVersion = environment.appVersion;
  protected compactType: 'vertical' | 'horizontal' | null = 'vertical';
  protected gridGap = 4;

  protected changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      autoFocus: false,
    });
  }

  protected tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      autoFocus: false,
    });
  }

  protected storeClicked(): void {
    this.dialog.open(StoreModalComponent, {
      autoFocus: false,
    });
  }

  protected manualStoreClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      autoFocus: false,
    });
  }

  protected optionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      autoFocus: false,
    });
  }

  protected ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      autoFocus: false,
    });
  }

  protected statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      autoFocus: false,
    });
  }

  protected achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      autoFocus: false,
    });
  }

  protected lockPanelsToggle() {
    this.gameStateService.lockPanels = !this.gameStateService.lockPanels;
  }

  protected onLayoutUpdated(layout: KtdGridLayout) {
    this.gameStateService.layout.set(layout);
    // always save when the player moves the windows around
    this.gameStateService.savetoLocalStorage();
  }

  protected getPanel(layoutPanel: KtdGridLayoutItem) {
    for (const panel of this.gameStateService.panels) {
      if (panel.id === layoutPanel.id) {
        return panel;
      }
    }
    return {
      id: 'undefinedPanel',
      name: '',
      icon: '',
      panelHelp: '',
    };
  }

  protected nextPanelClick(index: number) {
    this.gameStateService.changeLayoutPanel(index);
  }

  protected previousPanelClick(index: number) {
    this.gameStateService.changeLayoutPanel(index, true);
  }

  protected closePanelClick(index: number) {
    this.gameStateService.removeLayoutPanel(index);
  }

  protected saveClicked() {
    this.gameStateService.savetoLocalStorage();
    this.characterService.toast('Manual Save Complete');
  }
}

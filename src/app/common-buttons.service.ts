import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChangelogPanelComponent } from './changelog-panel/changelog-panel.component';
import { TutorialPanelComponent } from './tutorial-panel/tutorial-panel.component';
import { StoreModalComponent } from './store-modal/store-modal.component';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { StatisticsPanelComponent } from './statistics-panel/statistics-panel.component';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';
import { StoreService } from './game-state/store.service';
import { GameStateService } from './game-state/game-state.service';
import { CharacterService } from './game-state/character.service';

@Injectable({
  providedIn: 'root',
})
export class CommonButtonsService {
  private readonly dialog = inject(MatDialog);
  private readonly characterService = inject(CharacterService);
  private readonly gameStateService = inject(GameStateService);
  private readonly storeService = inject(StoreService);

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      autoFocus: false,
    });
  }

  tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      autoFocus: false,
    });
  }

  storeClicked(): void {
    this.dialog.open(StoreModalComponent, {
      autoFocus: false,
    });
  }

  manualStoreClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      autoFocus: false,
    });
  }

  optionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      autoFocus: false,
    });
  }

  ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      autoFocus: false,
    });
  }

  statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      autoFocus: false,
    });
  }

  achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      autoFocus: false,
    });
  }
  saveClicked() {
    this.gameStateService.savetoLocalStorage();
    this.characterService.toast('Manual Save Complete');
  }
}

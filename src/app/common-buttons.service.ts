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
import { CreditsModalComponent } from './credits-modal/credits-modal.component';
import { MainLoopService } from './game-state/main-loop.service';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root',
})
export class CommonButtonsService {
  private readonly dialog = inject(MatDialog);
  private readonly mainLoopService = inject(MainLoopService);
  private readonly gameStateService = inject(GameStateService);
  private readonly storeService = inject(StoreService);
  private readonly appService = inject(AppService);

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      autoFocus: false,
      width: this.appService.isMobile() ? '100vw' : '600px',
      maxWidth: this.appService.isMobile() ? '100vw' : '600px',
      maxHeight: '100vh',
    });
  }

  tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      autoFocus: false,
      width: this.appService.isMobile() ? '100vw' : undefined,
      maxWidth: this.appService.isMobile() ? '100vw' : undefined,
      maxHeight: '100vh',
    });
  }

  storeClicked(): void {
    this.dialog.open(StoreModalComponent, {
      width: this.appService.isMobile() ? '100vw' : '600px',
      maxWidth: this.appService.isMobile() ? '100vw' : '600px',
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  manualStoreClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      width: this.appService.isMobile() ? '100vw' : '600px',
      maxWidth: this.appService.isMobile() ? '100vw' : '600px',
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  optionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      width: this.appService.isMobile() ? '100vw' : undefined,
      maxWidth: this.appService.isMobile() ? '100vw' : undefined,
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      width: this.appService.isMobile() ? '100vw' : undefined,
      maxWidth: this.appService.isMobile() ? '100vw' : undefined,
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      width: this.appService.isMobile() ? '100vw' : undefined,
      maxWidth: this.appService.isMobile() ? '100vw' : undefined,
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      width: this.appService.isMobile() ? '100vw' : undefined,
      maxWidth: this.appService.isMobile() ? '100vw' : undefined,
      maxHeight: '100vh',
      autoFocus: false,
    });
  }

  saveClicked() {
    this.gameStateService.savetoLocalStorage();
    this.mainLoopService.toast('Manual Save Complete');
  }

  creditsClicked() {
    this.gameStateService.creditsClicked = true;
    this.dialog.open(CreditsModalComponent, {
      autoFocus: false,
    });
  }
}

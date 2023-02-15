import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-save-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.less'],
})
export class SaveModalComponent {
  error = '';

  constructor(public gameStateService: GameStateService) {}

  fileClicked(fileNum: string) {
    this.gameStateService.saveSlot = fileNum;
    this.gameStateService.setSaveFile();
    const success = this.gameStateService.loadFromLocalStorage();
    this.error = success ? '' : 'Empty Save Selected';
    if (success) {
      this.gameStateService.updateImportFlagKey(true);
      // eslint-disable-next-line no-self-assign
      window.location.href = window.location.href;
    }
  }

  autoSaveInterval(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.gameStateService.changeAutoSaveInterval(parseInt(event.target.value));
  }
}

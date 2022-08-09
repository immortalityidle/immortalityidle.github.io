import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

@Component({
  selector: 'app-save-modal',
  templateUrl: './save-modal.component.html',
  styleUrls: ['./save-modal.component.less']
})
export class SaveModalComponent {
  newSave = "";
  errorMsg = "";

  constructor(
    public gameStateService: GameStateService
  ) { }

  saveSlotChanged(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.gameStateService.saveSlots.slot = event.target.value;
    this.gameStateService.setSaveFileList();
  }

  newSaveSlot(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    event.stopPropagation();
    this.newSave = event.target.value;
  }

  addToSaveList() {
    this.newSave.trim();
    if (this.gameStateService.saveSlots.list.includes(this.newSave)) {
      this.errorMsg = "This name is already in use";
      return;
    } else if (this.newSave === "") {
      this.errorMsg = "Please enter a save name";
      return;
    }
    if (this.gameStateService.saveSlots.list.length === 0) { // Fresh list
      if (window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.gameStateService.getDeploymentFlavor())){
        this.gameStateService.transferLegacySave();
      }
    }
    this.gameStateService.saveSlots.list.push(this.newSave);
    this.gameStateService.saveSlots.slot = this.newSave;
    this.gameStateService.setSaveFileList();
    this.gameStateService.savetoLocalStorage();
    this.errorMsg = "New File Saved";
    return;
  }
}

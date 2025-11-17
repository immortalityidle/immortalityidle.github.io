import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CharacterService } from '../game-state/character.service';
import { FollowersService } from '../game-state/followers.service';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { environment } from '../../environments/environment';
import { FarmService } from '../game-state/farm.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-options-modal',
  templateUrl: './options-modal.component.html',
  styleUrls: ['./options-modal.component.less'],
  imports: [forwardRef(() => FormsModule)],
})
export class OptionsModalComponent {
  constructor(
    public homeService: HomeService,
    public farmService: FarmService,
    public characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService,
    public followerService: FollowersService,
    public mainLoopService: MainLoopService,
    public dialog: MatDialog
  ) {}

  hardResetClicked(event: Event): void {
    event.preventDefault();
    if (confirm('This will reset everything permanently. Are you sure?')) {
      const value = prompt(
        'For real, this will reset the whole game as if you\'ve never played it. If you\'re really sure, type "RESET" to start all the way over.'
      );
      if (value?.toLowerCase() === 'reset') {
        this.gameStateService.hardReset();
      }
    }
  }

  rebirthClicked(event: Event) {
    event.preventDefault();
    if (confirm('This will end your current life. Are you sure?')) {
      this.gameStateService.rebirth();
    }
  }

  darkModeToggle() {
    this.gameStateService.isDarkMode = !this.gameStateService.isDarkMode;
  }

  easyModeChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.characterService.easyMode) {
      //coming back from easy mode
      this.characterService.easyMode = false;
    } else {
      if (!this.gameStateService.easyModeEver) {
        if (confirm('This will enable easy mode and mark your save permanently. Are you sure?')) {
          this.gameStateService.easyModeEver = true;
        } else {
          event.target.checked = false;
          return;
        }
      }
      this.characterService.easyMode = true;
    }
  }

  playMusicChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.playMusic = event.target.checked;
    this.mainLoopService.playAudio();
  }

  playMusicChangeVolume(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.audio.volume = parseFloat(event.target.value);
  }

  showLifeSummaryChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.characterService.showLifeSummary = event.target.checked;
  }

  showTipsChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.characterService.showTips = event.target.checked;
  }

  showUpdateAnimationsChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.characterService.showUpdateAnimations = event.target.checked;
  }

  scientificNotationChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.scientificNotation = event.target.checked;
    this.gameStateService.savetoLocalStorage();
    // eslint-disable-next-line no-self-assign
    window.location.href = window.location.href;
  }

  importGameFileClick(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (file) {
      const Reader = new FileReader();
      const gameStateService = this.gameStateService;
      const mainLoopService = this.mainLoopService;
      Reader.readAsText(file, 'UTF-8');
      Reader.onload = function () {
        if (typeof Reader.result === 'string') {
          mainLoopService.importing = true;
          gameStateService.importGame(Reader.result);
          gameStateService.savetoLocalStorage();
          // refresh the page
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }
      };
    }
  }

  exportGameFileClick() {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(this.gameStateService.getGameExport())}`
    );
    element.setAttribute(
      'download',
      `Immortality_Idle_${
        this.gameStateService.isExperimental ? 'Experimental' : 'v' + environment.appVersion
      }_${new Date().toISOString()}.txt`
    );
    const event = new MouseEvent('click');
    element.dispatchEvent(event);
  }

  importLayoutFileClick(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (file) {
      const Reader = new FileReader();
      const gameStateService = this.gameStateService;
      Reader.readAsText(file, 'UTF-8');
      Reader.onload = function () {
        if (typeof Reader.result === 'string') {
          gameStateService.importLayout(Reader.result);
          gameStateService.savetoLocalStorage();
        }
      };
    }
  }

  exportLayoutFileClick() {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(this.gameStateService.getLayoutExport())}`
    );
    element.setAttribute(
      'download',
      `Immortality_Idle_Layout_${
        this.gameStateService.isExperimental ? 'Experimental' : 'v' + environment.appVersion
      }_${new Date().toISOString()}.txt`
    );
    const event = new MouseEvent('click');
    element.dispatchEvent(event);
  }

  autoSaveInterval(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.gameStateService.changeAutoSaveInterval(parseInt(event.target.value));
  }
}

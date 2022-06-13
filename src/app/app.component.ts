import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from './game-state/game-state.service';
import { MainLoopService } from './main-loop.service';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { HostListener } from '@angular/core';
import { StoreService } from './game-state/store.service';
import { CharacterService } from './game-state/character.service';
import { formatNumber } from '@angular/common';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';

@Pipe({name: 'floor'})
export class FloorPipe implements PipeTransform {
    /**
     *
     * @param value
     * @returns {number}
     */
    transform(value: number): number {
        return Math.floor(value);
    }
}

@Pipe({name: 'camelToTitle'})
export class CamelToTitlePipe implements PipeTransform {
    /**
     *
     * @param value
     * @returns {string}
     */
     transform(value: string): string {
      value = value.split(/(?=[A-Z])/).join(' ');
      value = value[0].toUpperCase() + value.slice(1);
      return value;
  }
}

@Pipe({name: 'bigNumber'})
export class BigNumberPipe implements PipeTransform {
    /**
     *
     * @param value
     * @returns {string}
     */
     transform(value: number): string {
      if (value < 10000){
        return formatNumber(value,"en-US", "1.0-0");
      } else if (value < 1000000){
        return formatNumber(value / 1000,"en-US", "1.0-2") + "K";
      } else if (value < 1000000000){
        return formatNumber(value / 1000000,"en-US", "1.0-2") + "M";
      } else if (value < 1000000000000){
        return formatNumber(value / 1000000000,"en-US", "1.0-2") + "B";
      } else {
        return formatNumber(value / 1000000000000,"en-US", "1.0-2") + "T";
      }
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'immortalityidle';

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code == 'Space'){
      this.mainLoopService.pause = !this.mainLoopService.pause;
      event.preventDefault();
    }
  }

  constructor(
    private mainLoopService: MainLoopService,
    private gameStateService: GameStateService,
    private storeService: StoreService,
    public characterService: CharacterService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();
  }

  hardResetClicked(): void {
    if (confirm("This will reset everything, are you sure?")){
      this.gameStateService.hardReset();
    }
  }

  saveClicked(event: Event): void {
    event.preventDefault();
    this.gameStateService.savetoLocalStorage();
  }

  storeClicked(): void {
    const dialogRef = this.dialog.open(ManualStoreModalComponent, {
      width: '510px',
      data: {someField: 'foo'}
    });
  }

  storeOptionsClicked(): void {
    const dialogRef = this.dialog.open(OptionsModalComponent, {
      width: '500px',
      data: {someField: 'foo'}
    });
  }

  cheat(event: Event): void {
    event.preventDefault();
    this.gameStateService.cheat();
  }

  rebirthClicked(event: Event){
    event.preventDefault();
    this.gameStateService.rebirth();
  }

  ascensionStoreClicked(){
    this.storeService.updateAscensions();
    const dialogRef = this.dialog.open(AscensionStoreModalComponent, {
      width: '500px',
      data: {someField: 'foo'}
    });
  }

  achievementsClicked(){
    const dialogRef = this.dialog.open(AchievementPanelComponent, {
      width: '500px',
      data: {someField: 'foo'}
    });
  }
}

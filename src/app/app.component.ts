import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from './game-state/game-state.service';
import { MainLoopService } from './main-loop.service';
import { StoreModalComponent } from './store-modal/store-modal.component';
import { HostListener } from '@angular/core';

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
  storeClicked(): void {
    const dialogRef = this.dialog.open(StoreModalComponent, {
      width: '400px',
      data: {someField: 'foo'}
    });
  }
}

import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { GameStateService } from './game-state/game-state.service';
import { MainLoopService } from './main-loop.service';

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

  constructor(
    private mainLoopService: MainLoopService,
    private gameStateService: GameStateService
  ) {}

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();
  }

  hardResetClicked(): void {
    this.gameStateService.hardReset();
  }
}

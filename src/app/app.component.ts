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
}

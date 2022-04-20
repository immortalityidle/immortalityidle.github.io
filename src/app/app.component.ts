import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { GameState } from './game-state/game-state';
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

  gameState = new GameState();

  constructor(
    private mainLoopService: MainLoopService
  ) {}

  ngOnInit(): void {
    this.mainLoopService.start();
  }
}

import { Component, OnInit } from '@angular/core';
import { Activity } from '../game-state/activity';
import { Character, CharacterAttribute } from '../game-state/character';
import { GameStateService } from '../game-state/game-state.service';
import { MainLoopService } from '../main-loop.service';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less']
})
export class TimePanelComponent implements OnInit {
  character: Character;

  currentActivity?: Activity = undefined;
  currentActivityIndex = 0;
  currentActivityTickCount = 0;
  activities: Activity[];

  constructor(
    private mainLoopService: MainLoopService,
    gameStateService: GameStateService
  ) {
    this.activities = gameStateService.gameState.activityLoop;
    this.character = gameStateService.gameState.characterState;
  }

  ngOnInit(): void {
    this.mainLoopService.tickSubject.subscribe(
      (next) => {
        if (this.activities.length > 0) {
          this.currentActivity = this.activities[this.currentActivityIndex];
          this.currentActivity.consequence();
          if (this.currentActivityTickCount < this.currentActivity.repeatTimes) {
            this.currentActivityTickCount++;
          } else {
            this.currentActivityIndex++;
            this.currentActivityTickCount = 0;
            if (this.currentActivityIndex == this.activities.length) {
              this.currentActivityIndex = 0;
            }
          }
        }
      }
    )
  }

  onPlusClick(activity: Activity): void{
    activity.repeatTimes++;
  }

  onMinusClick(activity: Activity): void{
    activity.repeatTimes--;
  }

}

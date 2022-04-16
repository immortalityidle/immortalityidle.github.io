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
          this.character.age++;
          // check for death
          if (this.character.status.health.current <= 0 || this.character.age >= this.character.lifespan){
            //TODO: call reincarnation function
          }
          // check for exhaustion
          if (this.character.status.stamina.current <= 0){
            this.character.age += 24;
            this.character.status.stamina.current = this.character.status.stamina.max;
            this.currentActivityTickCount = 0;
            this.currentActivityIndex = 0;
          }
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

  onUpClick(activity: Activity): void{
    let index = this.activities.indexOf(activity);
    if (index != 0 && this.activities.length > 1){
      let swapper = this.activities[index - 1];
      this.activities[index - 1] = activity;
      this.activities[index] = swapper;
    }
  }

  onDownClick(activity: Activity): void{
    let index = this.activities.indexOf(activity);
    if (index != this.activities.length - 1 && this.activities.length > 1){
      let swapper = this.activities[index + 1];
      this.activities[index + 1] = activity;
      this.activities[index] = swapper;
    }
  }

}

import { Component, OnInit } from '@angular/core';
import { Activity, ActivityCostType, ActivityRewardType } from '../game-state/activity';
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
          const currentActivity = this.activities[this.currentActivityIndex];
          for(const cost of currentActivity.costs) {
            switch (cost.type) {
              case ActivityCostType.Time:
                if (this.currentActivityTickCount < cost.amount) {
                  this.currentActivityTickCount++;
                } else {
                  this.earnReward(currentActivity);
                  this.currentActivityTickCount = 0;
                  this.currentActivityIndex++;
                  if (this.currentActivityIndex == this.activities.length) {
                    this.currentActivityIndex = 0;
                  }
                }
                break;
              default:
                console.error('Unknown cost type:' + cost.type);
            }
          }
        }
      }
    )
  }

  earnReward(activity: Activity) {
    for (const reward of activity.rewards) {
      switch(reward.type) {
        case ActivityRewardType.Attribute:
          // TODO: This doesn't scale well. There's probably a better way to do this.
          switch (reward.attribute) {
            case CharacterAttribute.Charisma:
              this.character.attributes.charisma++;
              break;
            case CharacterAttribute.Intelligence:
              this.character.attributes.intelligence++;
              break;
            case CharacterAttribute.Speed:
              this.character.attributes.speed++;
              break;
            case CharacterAttribute.Strength:
              this.character.attributes.strength++;
              break;
            case CharacterAttribute.Toughness:
              this.character.attributes.toughness++;
              break;
          }
          break;
        default:
          console.error('Unknown reward type:' + reward.type);
      }
    }
  }
}

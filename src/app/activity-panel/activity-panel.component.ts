import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { Character } from '../game-state/character';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less']
})
export class ActivityPanelComponent {

  character: Character;

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    characterService: CharacterService
  ) {
    this.character = characterService.characterState;
  }

  onClick(activity: Activity, event: MouseEvent): void {
    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1
    repeat *= event.shiftKey ? 10 : 1
    repeat *= event.ctrlKey ? 10 : 1

    // Alt will put it at the top of the schedule, otherwise the bottom
    if (event.altKey) {
      this.activityService.activityLoop.unshift({
        activity: activity.activityType,
        repeatTimes: repeat
      });
    } else {
      this.activityService.activityLoop.push({
        activity: activity.activityType,
        repeatTimes: repeat
      });
    }
  }

  drag(activity: Activity, event: DragEvent){
    event.dataTransfer?.setData("activity", "" + activity.activityType);
  }
}

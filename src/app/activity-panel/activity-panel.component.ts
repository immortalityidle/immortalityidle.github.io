import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { Activity, ActivityLoopEntry } from '../game-state/activity';
import { Character, CharacterAttribute } from '../game-state/character';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less']
})
export class ActivityPanelComponent implements OnInit {

  activities: Activity[];
  gameStateService: GameStateService;
  character: Character;

  constructor(gameStateService: GameStateService) {
    this.activities = gameStateService.gameState.activities;
    this.character = gameStateService.gameState.characterState;
    this.gameStateService = gameStateService;
  }

  ngOnInit(): void {
  }

  onClick(activity: Activity){
    this.gameStateService.gameState.activityLoop.push({
      activity: activity,
      repeatTimes: 1
    });
  }

  meetsRequirements(activity: Activity, character: Character): boolean {
    const keys = Object.keys(character.attributes);
    for (const keyIndex in keys){
      const key = keys[keyIndex];
      // @ts-ignore
      if (character.attributes[key] < activity.requirements[key]){
        return false;
      }
    }
    return true;
  }
}

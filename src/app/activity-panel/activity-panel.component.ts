import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterAttribute } from '../game-state/character';
import { ActivityService } from './activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { Character } from '../game-state/character';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less']
})
export class ActivityPanelComponent implements OnInit {

  activities: Activity[];
  character: Character;

  constructor(
    public gameStateService: GameStateService,
    private activityService: ActivityService,
    characterService: CharacterService
  ) {
    this.activities = activityService.activities;
    this.character = characterService.characterState;
  }

  ngOnInit(): void {
  }

  onClick(activity: Activity){
    this.activityService.activityLoop.push({
      activity: activity,
      repeatTimes: 1
    });
  }

  meetsRequirements(activity: Activity, character: Character): boolean {
    const keys: (keyof CharacterAttribute)[] = Object.keys(character.attributes) as (keyof CharacterAttribute)[];
    for (const keyIndex in keys){
      const key = keys[keyIndex];
      if (character.attributes[key].value < activity.requirements[key]){
        return false;
      }
    }
    return true;
  }
}

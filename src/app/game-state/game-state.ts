import { Activity } from './activity';
import { Character, CharacterAttribute } from './character';

export class GameState {
  characterState = new Character();
  activityLoop: Activity[] = [];

  constructor() {
    this.activityLoop.push({
      name: 'Blacksmithing',
      repeatTimes: 5,
      consequence: () => {
        this.characterState.attributes.strength += .1;
        this.characterState.status.stamina.current -= 5;
        this.characterState.money += Math.floor(this.characterState.attributes.strength * 0.1);
      }
    });

    this.activityLoop.push({
      name: 'Begging',
      repeatTimes: 3,
      consequence: () => {
        this.characterState.attributes.charisma += 1;
        this.characterState.status.stamina.current -= 1;
        this.characterState.money += Math.floor(this.characterState.attributes.charisma * 0.1);
      }
    });

    this.activityLoop.push({
      name: 'Resting',
      repeatTimes: 8,
      consequence: () => {
        this.characterState.status.stamina.current += 1;
      }
    });

  }
}

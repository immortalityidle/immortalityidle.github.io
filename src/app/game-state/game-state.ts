import { Activity, ActivityRewardType } from './activity';
import { Character, CharacterAttribute } from './character';

export class GameState {
  characterState = new Character();
  activityLoop: Activity[] = [];

  constructor() {
    this.activityLoop.push({
      name: 'Software Testing',
      timeCost: 10,
      costs: [],
      rewards: [
        {
          type: ActivityRewardType.Attribute,
          attribute: CharacterAttribute.Toughness,
          amount: 1,
        },
      ],
    });

    this.activityLoop.push({
      name: 'Tripping and falling',
      timeCost: 20,
      costs: [],
      rewards: [
        {
          type: ActivityRewardType.Attribute,
          attribute: CharacterAttribute.Charisma,
          amount: 1,
        },
      ],
    });
  }
}

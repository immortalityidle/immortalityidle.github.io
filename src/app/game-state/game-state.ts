import { Activity, ActivityCostType, ActivityRewardType } from "./activity";
import { Character, CharacterAttribute } from "./character";

export class GameState {
  characterState = new Character();
  activityLoop: Activity[] = []

  constructor() {
    this.activityLoop.push(
      {
        name: "Software Testing",
        costs: [{type: ActivityCostType.Time, amount: 10 }],
        rewards: [{
          type: ActivityRewardType.Attribute,
          attribute: CharacterAttribute.Toughness,
          amount: 1}]
      }
    )
  }
}

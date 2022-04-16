export interface  CharacterAttribute {
  strength: number,
  toughness: number,
  speed: number,
  intelligence: number,
  charisma: number,
  spirituality: number
}

export class Character {
  attributes: CharacterAttribute = {
    strength: 1,
    toughness: 1,
    speed: 1,
    intelligence: 1,
    charisma: 1,
    spirituality: 0
  }
  status = {
    health: {
      current: 100,
      max: 100
    },
    stamina: {
      current: 100,
      max: 100
    },
    mana: {
      current: 0,
      max: 0
    }
  }
  money = 0;
  // age in hours
  age = 18 * 365 * 24;
  lifespan = 30 * 365 * 24;
  equipment = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null
  }

}

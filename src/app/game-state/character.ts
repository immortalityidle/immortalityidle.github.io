export enum CharacterAttribute {
  Strength,
  Toughness,
  Speed,
  Intelligence,
  Charisma
}

export class Character {
  attributes = {
    strength: 0,
    toughness: 0,
    speed: 0,
    intelligence: 0,
    charisma: 0
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
      current: 100,
      max: 100
    }
  }
}

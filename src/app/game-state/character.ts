import { HealthPanelComponent } from "../health-panel/health-panel.component";

export interface CharacterAttribute {
  strength: number,
  toughness: number,
  speed: number,
  intelligence: number,
  charisma: number,
  spirituality: number
}

export type AttributeType = 'strength' | 'toughness' | 'speed' | 'intelligence' | 'charisma' | 'spirituality';

export class Character {
  attributes: {[key in AttributeType]: {description: string, value: number, aptitude: number}} = {
    strength: {
      description: "An immortal must have raw physical power.",
      value: 1,
      aptitude: 1
    },
    toughness: {
      description: "An immortal must develop resilience to endure hardship.",
      value: 1,
      aptitude: 1
    },
    speed: {
      description: "An immortal must be quick of foot and hand.",
      value: 1,
      aptitude: 1
    },
    intelligence: {
      description: "An immortal must understand the workings of the universe.",
      value: 1,
      aptitude: 1
    },
    charisma: {
      description: "An immortal must influence the hearts and minds of others.",
      value: 1,
      aptitude: 1
    },
    spirituality: {
      description: "An immortal must find deep connections to the divine.",
      value: 0,
      aptitude: 1
    }
  };
  skills = {
    metalLore: {
      description: "Understanding metals and how to forge and use them.",
      value: 0,
      aptitude: 1
    },
    plantLore: {
      description: "Understanding plants and how to grow and care for them.",
      value: 0,
      aptitude: 1
    },
    alchemy: {
      description: "Understanding potions and pills and how to make and use them.",
      value: 0,
      aptitude: 1
    }
  };
  status = {
    health: {
      value: 100,
      max: 100
    },
    stamina: {
      value: 100,
      max: 100
    },
    mana: {
      value: 0,
      max: 0
    }
  };
  money = 0;
  land = 0;
  // age in days
  age = 18 * 365;
  lifespan = 30 * 365;
  equipment = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null
  }

  checkOverage(){
    if (this.status.health.value > this.status.health.max){
      this.status.health.value = this.status.health.max;
    }
    if (this.status.stamina.value > this.status.stamina.max){
      this.status.stamina.value = this.status.stamina.max;
    }
  }
}

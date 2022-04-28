import { Equipment, Item } from './inventory.service'

export interface CharacterAttribute {
  strength?: number,
  toughness?: number,
  speed?: number,
  intelligence?: number,
  charisma?: number,
  spirituality?: number,
  metalLore?: number,
  plantLore?: number,
  alchemy?: number
}

export type AttributeType = 'strength' |
  'toughness' |
  'speed' |
  'intelligence' |
  'charisma' |
  'spirituality' |
  'metalLore' |
  'plantLore' |
  'animalLore' |
  'alchemy';

type AttributeObject = {[key in AttributeType]: {description: string, value: number, aptitude: number, icon: string}};

export type EquipmentPosition = 'head' | 'body' | 'leftHand' | 'rightHand' | 'legs' | 'feet';

export type EquipmentSlots  = { [key in EquipmentPosition]: Equipment | null };

type StatusType = 'health' | 'stamina' | 'mana' | 'nourishment';
type CharacterStatus = {[key in StatusType]: {description: string, value: number, max: number}}

export interface CharacterProperties {
  attributes: AttributeObject,
  money: number,
  equipment: EquipmentSlots,
  age: number,
  status: CharacterStatus
}

const INITIAL_AGE = 18 * 365;
export class Character {
  dead: boolean = false;
  attributes: AttributeObject = {
    strength: {
      description: "An immortal must have raw physical power.",
      value: 1,
      aptitude: 1,
      icon: "fitness_center"
    },
    toughness: {
      description: "An immortal must develop resilience to endure hardship.",
      value: 1,
      aptitude: 1,
      icon: "castle"
    },
    speed: {
      description: "An immortal must be quick of foot and hand.",
      value: 1,
      aptitude: 1,
      icon: "directions_run"
    },
    intelligence: {
      description: "An immortal must understand the workings of the universe.",
      value: 1,
      aptitude: 1,
      icon: "local_library"
    },
    charisma: {
      description: "An immortal must influence the hearts and minds of others.",
      value: 1,
      aptitude: 1,
      icon: "chat_bubble_outline"
    },
    spirituality: {
      description: "An immortal must find deep connections to the divine.",
      value: 0,
      aptitude: 1,
      icon: "auto_awesome"
    },
    metalLore: {
      description: "Understanding metals and how to forge and use them.",
      value: 0,
      aptitude: 1,
      icon: "hardware"
    },
    plantLore: {
      description: "Understanding plants and how to grow and care for them.",
      value: 0,
      aptitude: 1,
      icon: "forest"
    },
    animalLore: {
      description: "Understanding animals and monsters and how to deal with them.",
      value: 0,
      aptitude: 1,
      icon: "pets"
    },
    alchemy: {
      description: "Understanding potions and pills and how to make and use them.",
      value: 0,
      aptitude: 1,
      icon: "emoji_food_beverage"
    }
  };
  status: CharacterStatus = {
    health: {
      description: "Physical well-being. Take too much damage and you will die.",
      value: 100,
      max: 100
    },
    stamina: {
      description: "Physical energy to accomplish tasks. Most activities use stamina, and if you let yourself run down you could get sick and have to stay in bed for a few days.",
      value: 100,
      max: 100
    },
    mana: {
      description: "Magical energy required for mysterious spiritual activities.",
      value: 0,
      max: 0
    },
    nourishment: {
      description: "Eating is essential to life. You will automatically eat whatever food you have available when you are hungry. If you run out of food you will automatically spend your money on a bowl of rice each day.",
      value: 7,
      max: 14
    }
  };
  money = 300;
  // age in days
  age = INITIAL_AGE;
  lifespan = 30 * 365;
  equipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null
  }

  // reset everything but increase aptitudes
  reincarnate(){
    this.status.health.value = 100;
    this.status.health.max = 100;
    this.status.stamina.value = 100;
    this.status.stamina.max = 100;
    this.status.nourishment.value = 7;
    this.status.nourishment.max = 14;
    this.status.mana.max = 0;
    this.status.mana.value = 0;

    let totalAptitude = 0;
    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys){
      if (this.attributes[keys[key]].value > 0){
        // gain aptitude based on last life's value
        this.attributes[keys[key]].aptitude += this.attributes[keys[key]].value / 100;
        // start at the aptitude value
        this.attributes[keys[key]].value = this.attributes[keys[key]].aptitude;
      }
      totalAptitude += this.attributes[keys[key]].aptitude;
    }
    const key = keys[Math.floor(Math.random() * (keys.length - 1))];
    this.money = 0;
    // age in days
    this.age = INITIAL_AGE;
    // increase lifespan by 1% the average aptitude
    this.lifespan = 30 * 365 + (0.1 * (totalAptitude / Object.keys(this.attributes).length));
    this.equipment = {
      head: null,
      body: null,
      leftHand: null,
      rightHand: null,
      legs: null,
      feet: null
    }
  }

  getAptitudeMultipier(aptitude: number){
    if (aptitude < 10){
      return aptitude;
    } else {
      return 10 + Math.log2(aptitude);
    }
  }

  increaseAttribute(attribute: AttributeType, amount: number){
    this.attributes[attribute].value += (amount * this.getAptitudeMultipier(this.attributes[attribute].aptitude));
  }

  checkOverage(){
    if (this.status.health.value > this.status.health.max){
      this.status.health.value = this.status.health.max;
    }
    if (this.status.stamina.value > this.status.stamina.max){
      this.status.stamina.value = this.status.stamina.max;
    }
    if (this.status.nourishment.value > this.status.nourishment.max){
      this.status.nourishment.value = this.status.nourishment.max;
    }
  }

  getProperties(): CharacterProperties {
    return {
      attributes: this.attributes,
      money: this.money,
      equipment: this.equipment,
      age: this.age,
      status: this.status
    }
  }

  setProperties(properties: CharacterProperties) {
    this.attributes = properties.attributes;
    this.money = properties.money;
    this.equipment = properties.equipment;
    this.age = properties.age || INITIAL_AGE;
    this.status = properties.status;
  }
}

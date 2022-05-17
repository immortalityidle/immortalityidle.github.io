import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { Equipment, Item } from './inventory.service'

export interface CharacterAttribute {
  strength?: number,
  toughness?: number,
  speed?: number,
  intelligence?: number,
  charisma?: number,
  spirituality?: number,
  earthLore?: number,
  metalLore?: number,
  plantLore?: number,
  animalLore?: number,
  alchemy?: number
}

export type AttributeType = 'strength' |
  'toughness' |
  'speed' |
  'intelligence' |
  'charisma' |
  'spirituality' |
  'earthLore' |
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
  status: CharacterStatus,
  baseLifespan: number,
  foodLifespan: number,
  statLifespan: number,
  attributeScalingLimit: number,
  attributeSoftCap: number,
  aptitudeGainDivider: number,
  condenseSoulCoreCost: number,
  reinforceMeridiansCost: number
}

const INITIAL_AGE = 18 * 365;

export class Character {
  dead: boolean = false;
  attributeScalingLimit: number = 10;
  attributeSoftCap: number = 10000;
  aptitudeGainDivider: number = 100;
  condenseSoulCoreCost: number = 10;
  reinforceMeridiansCost: number = 1000;
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
      icon: "forum"
    },
    spirituality: {
      description: "An immortal must find deep connections to the divine.",
      value: 0,
      aptitude: 1,
      icon: "auto_awesome"
    },
    earthLore: {
      description: "Understanding the earth and how to draw power and materials from it.",
      value: 0,
      aptitude: 1,
      icon: "landslide"
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
  baseLifespan = 30 * 365;
  foodLifespan = 0; // bonus to lifespan based on food you've eaten
  statLifespan = 0; // bonus to lifespan based on stat aptitudes
  lifespan = this.baseLifespan + this.foodLifespan + this.statLifespan;
  equipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null
  }

  // reset everything but increase aptitudes
  reincarnate(): void {
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
        this.attributes[keys[key]].aptitude += this.attributes[keys[key]].value / this.aptitudeGainDivider;
        // start at the aptitude value
        this.attributes[keys[key]].value = this.getAttributeStartingValue(this.attributes[keys[key]].aptitude);
      }
      totalAptitude += this.attributes[keys[key]].aptitude;
    }
    this.money = 0;
    // age in days
    this.age = INITIAL_AGE;
    this.baseLifespan += 1; //bonus day just for doing another reincarnation cycle
    this.statLifespan = (0.8 * (totalAptitude / Object.keys(this.attributes).length));
    this.foodLifespan = 0;
    this.recalculateLifespan();
    this.equipment = {
      head: null,
      body: null,
      leftHand: null,
      rightHand: null,
      legs: null,
      feet: null
    }
  }

  getAttributeStartingValue(aptitude: number): number{
    if (aptitude < this.attributeSoftCap){
      return aptitude;
    }
    return this.attributeSoftCap + Math.log2(aptitude - (this.attributeSoftCap - 1));
  }

  recalculateLifespan(): void{
    this.lifespan = this.baseLifespan + this.foodLifespan + this.statLifespan + this.attributes.spirituality.value;
  }

  //TODO: double check the math here and maybe cache the results on aptitude change instead of recalculating regularly
  getAptitudeMultipier(aptitude: number): number {
    if (aptitude < this.attributeScalingLimit){
      // linear up to the scaling limit
      return aptitude;
    } else if (aptitude < this.attributeScalingLimit * 10){
      // from the limit to 10x the limit, change growth rate to 1/4
      return this.attributeScalingLimit + ((aptitude - this.attributeScalingLimit) / 4);
    } else if (aptitude < this.attributeScalingLimit * 100){
      // from the 10x limit to 100x the limit, change growth rate to 1/20
      return this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        ((aptitude - (this.attributeScalingLimit * 10)) / 20);
    } else if (aptitude < this.attributeSoftCap){
      // from the 100x limit to softcap, change growth rate to 1/100
      return this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        (this.attributeScalingLimit * 90 / 20) +
        ((aptitude - (this.attributeScalingLimit * 100)) / 100);
    } else {
      // increase by log2 of whatever is over the softcap
      return this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        (this.attributeScalingLimit * 90 / 20) +
        (this.attributeScalingLimit * (this.attributeSoftCap - 100) / 100) +
        Math.log2(aptitude - this.attributeSoftCap + 1);
    }
  }

  increaseAttribute(attribute: AttributeType, amount: number): void {
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
      status: this.status,
      baseLifespan: this.baseLifespan,
      foodLifespan: this.foodLifespan,
      statLifespan: this.statLifespan,
      attributeScalingLimit: this.attributeScalingLimit,
      attributeSoftCap: this.attributeSoftCap,
      aptitudeGainDivider: this.aptitudeGainDivider,
      condenseSoulCoreCost: this.condenseSoulCoreCost,
      reinforceMeridiansCost: this.reinforceMeridiansCost
    }
  }

  setProperties(properties: CharacterProperties): void {
    this.attributes = properties.attributes;
    this.money = properties.money;
    this.equipment = properties.equipment;
    this.age = properties.age || INITIAL_AGE;
    this.status = properties.status;
    this.baseLifespan = properties.baseLifespan;
    this.foodLifespan = properties.foodLifespan;
    this.statLifespan = properties.statLifespan;
    this.attributeScalingLimit = properties.attributeScalingLimit;
    this.attributeSoftCap = properties.attributeSoftCap;
    this.aptitudeGainDivider = properties.aptitudeGainDivider;
    this.condenseSoulCoreCost = properties.condenseSoulCoreCost;
    this.reinforceMeridiansCost = properties.reinforceMeridiansCost;
    this.recalculateLifespan();
  }
}

import { Equipment, Item } from './inventory.service'
import { LogService } from './log.service';
import { formatNumber, TitleCasePipe } from '@angular/common';

export interface CharacterAttribute {
  strength?: number,
  toughness?: number,
  speed?: number,
  intelligence?: number,
  charisma?: number,
  spirituality?: number,
  earthLore?: number,
  metalLore?: number,
  woodLore?: number,
  waterLore?: number,
  fireLore?: number,
  animalHandling?: number
}

export type AttributeType = 'strength' |
  'toughness' |
  'speed' |
  'intelligence' |
  'charisma' |
  'spirituality' |
  'earthLore' |
  'metalLore' |
  'woodLore' |
  'waterLore' |
  'fireLore' |
  'animalHandling';

type AttributeObject = {[key in AttributeType]: {description: string, value: number, lifeStartValue: number, aptitude: number, icon: string}};

export type EquipmentPosition = 'head' | 'feet' | 'body' | 'legs' | 'leftHand' | 'rightHand';

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
  alchemyLifespan: number,
  statLifespan: number,
  spiritualityLifespan: number,
  magicLifespan: number,
  attributeScalingLimit: number,
  attributeSoftCap: number,
  aptitudeGainDivider: number,
  condenseSoulCoreCost: number,
  reinforceMeridiansCost: number,
  bloodlineCost: number,
  bloodlineRank: number,
  manaUnlocked: boolean,
  totalLives: number,
  healthBonusFood: number,
  healthBonusBath: number,
  healthBonusMagic: number,
  empowermentFactor: number,
  immortal: boolean,
}

const INITIAL_AGE = 18 * 365;

export class Character {

  constructor(private logService: LogService,
    private titlecasePipe: TitleCasePipe){
  }

  maxMoney = 1000000000000000000000000;
  totalLives = 1;
  dead = false;
  attributeScalingLimit = 10;
  attributeSoftCap = 100000;
  aptitudeGainDivider = 100;
  condenseSoulCoreCost = 10;
  condenseSoulCoreOriginalCost = 10;
  reinforceMeridiansCost = 1000;
  reinforceMeridiansOriginalCost = 1000;
  bloodlineCost = 100;
  bloodlineRank = 0;
  manaUnlocked = false;
  accuracy = 0;
  accuracyExponentMultiplier = 0.01;
  attackPower = 0;
  defense = 0;
  healthBonusFood = 0;
  healthBonusBath = 0;
  healthBonusMagic = 0;
  empowermentFactor = 1;
  immortal = false;
  ascensionUnlocked = false;
  attributes: AttributeObject = {
    strength: {
      description: "An immortal must have raw physical power.",
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      icon: "fitness_center"
    },
    toughness: {
      description: "An immortal must develop resilience to endure hardship.",
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      icon: "castle"
    },
    speed: {
      description: "An immortal must be quick of foot and hand.",
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      icon: "directions_run"
    },
    intelligence: {
      description: "An immortal must understand the workings of the universe.",
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      icon: "local_library"
    },
    charisma: {
      description: "An immortal must influence the hearts and minds of others.",
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      icon: "forum"
    },
    spirituality: {
      description: "An immortal must find deep connections to the divine.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "auto_awesome"
    },
    earthLore: {
      description: "Understanding the earth and how to draw power and materials from it.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "landslide"
    },
    metalLore: {
      description: "Understanding metals and how to forge and use them.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "hardware"
    },
    woodLore: {
      description: "Understanding plants and how to grow and care for them.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "forest"
    },
    waterLore: {
      description: "Understanding potions and pills and how to make and use them.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "emoji_food_beverage"
    },
    fireLore: {
      description: "Burn! Burn! BURN!!!",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "local_fire_department"
    },
    animalHandling: {
      description: "Skill in working with animals and monsters.",
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      icon: "pets"
    },
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
  alchemyLifespan = 0; // bonus to lifespan based on pills you've eaten
  statLifespan = 0; // bonus to lifespan based on base stat aptitudes
  spiritualityLifespan = 0; // bonus to lifespan based on spirituality
  magicLifespan = 0;
  lifespan = this.baseLifespan + this.foodLifespan + this.alchemyLifespan + this.statLifespan + this.spiritualityLifespan + this.magicLifespan;
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
    this.totalLives++;
    this.status.health.value = 100;
    this.status.health.max = 100;
    this.status.stamina.value = 100;
    this.status.stamina.max = 100;
    this.status.nourishment.value = 7;
    this.status.nourishment.max = 14;
    if (this.manaUnlocked){
      this.status.mana.max = 1;
      this.status.mana.value = 1;
    } else {
      this.status.mana.max = 0;
      this.status.mana.value = 0;
    }

    this.healthBonusFood = 0;
    this.healthBonusBath = 0;
    this.healthBonusMagic = 0;

    // age in days
    this.age = INITIAL_AGE;
    this.foodLifespan = 0;
    this.alchemyLifespan = 0;
    this.spiritualityLifespan = 0;
    this.magicLifespan = 0;
    let totalAptitude = 0;
    totalAptitude += this.attributes.strength.aptitude + this.attributes.toughness.aptitude +
      this.attributes.speed.aptitude + this.attributes.intelligence.aptitude + this.attributes.charisma.aptitude;
    this.statLifespan = this.getAptitudeMultipier(totalAptitude / 5);
    if (this.bloodlineRank < 5){
      this.statLifespan *= 0.1;
    }

    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys){
      if (this.attributes[keys[key]].value > 0){
        // gain aptitude based on last life's value
        const addedValue = (this.attributes[keys[key]].value - (this.attributes[keys[key]].lifeStartValue || 0 )) / this.aptitudeGainDivider;
        if (addedValue > 0){
          // never reduce aptitudes during reincarnation
          this.attributes[keys[key]].aptitude += addedValue;
          this.logService.addLogMessage("Your aptitude for " + this.titlecasePipe.transform(keys[key]) + " increased by " + formatNumber(addedValue,"en-US", "1.0-3"), "STANDARD", "EVENT");
        }
        // start at the aptitude value
        this.attributes[keys[key]].value = this.getAttributeStartingValue(this.attributes[keys[key]].value, this.attributes[keys[key]].aptitude);
        this.attributes[keys[key]].lifeStartValue = this.attributes[keys[key]].value;
      }
    }
    if (this.bloodlineRank < 3) {
      this.money = 0;
    } else if (this.bloodlineRank < 4) {
      this.money = this.money / 8;
    } else {
      this.money = 4 * this.money;
    }
    if (this.money > this.maxMoney) {
      this.money = this.maxMoney;
    }
    this.recalculateDerivedStats();
    if (this.bloodlineRank === 0) {
      this.equipment = {
        head: null,
        body: null,
        leftHand: null,
        rightHand: null,
        legs: null,
        feet: null
      }
    } else if (this.bloodlineRank <= 1) {
      this.equipment.body = null;
      this.equipment.head = null;
      this.equipment.legs = null;
      this.equipment.feet = null;
    }
  }

  getAttributeStartingValue(value: number, aptitude: number): number{
    if (value < 0){
      value = 0;
    }
    if (aptitude < 0){
      aptitude = 0;
    }
    if (value < 1){
      return value / 10;
    }
    if (aptitude < this.attributeSoftCap){
      return aptitude / 10;
    }
    return (this.attributeSoftCap / 10) + Math.log2(aptitude - (this.attributeSoftCap - 1));
  }

  recalculateDerivedStats(): void{
    this.status.health.max = 100 + this.healthBonusFood + this.healthBonusBath + this.healthBonusMagic +
      Math.floor(Math.log2(this.attributes.toughness.value + 2) * 5);
    if (this.money > this.maxMoney){
      this.money = this.maxMoney;
    }
    this.spiritualityLifespan = this.getAptitudeMultipier(this.attributes.spirituality.value) * 5;    
    this.lifespan = this.baseLifespan + this.foodLifespan + this.alchemyLifespan + this.statLifespan + this.spiritualityLifespan + this.magicLifespan;
    this.accuracy = 1 - Math.exp(0 - this.getAptitudeMultipier(this.attributes.speed.value) * this.accuracyExponentMultiplier);
    this.defense = Math.floor(Math.log10(this.attributes.toughness.value));
    this.attackPower = Math.floor(Math.log10(this.attributes.strength.value)) || 1;
    if (this.equipment.leftHand){
      this.attackPower += (this.equipment.leftHand.weaponStats?.baseDamage || 0);
    }
    if (this.equipment.rightHand){
      this.attackPower += (this.equipment.rightHand.weaponStats?.baseDamage || 0);
    }
    if (this.equipment.head){
      this.defense += (this.equipment.head.armorStats?.defense || 0);
    }
    if (this.equipment.body){
      this.defense += (this.equipment.body.armorStats?.defense || 0);
    }
    if (this.equipment.legs){
      this.defense += (this.equipment.legs.armorStats?.defense || 0);
    }
    if (this.equipment.feet){
      this.defense += (this.equipment.feet.armorStats?.defense || 0);
    }
  }

  getEmpowermentMult(): number{
    const max = 100;
    return 1 + 2 * max / (1 + Math.pow(1.02, (-this.empowermentFactor / 3))) - max;
  }

  //TODO: double check the math here and maybe cache the results on aptitude change instead of recalculating regularly
  getAptitudeMultipier(aptitude: number): number {
    if (aptitude < 0){
      // should not happen, but sanity check it
      aptitude = 0;
    }
    const empowermentFactor = this.getEmpowermentMult();
    if (aptitude < this.attributeScalingLimit){
      // linear up to the scaling limit
      return aptitude * empowermentFactor;
    } else if (aptitude < this.attributeScalingLimit * 10){
      // from the limit to 10x the limit, change growth rate to 1/4
      return (this.attributeScalingLimit + ((aptitude - this.attributeScalingLimit) / 4)) * empowermentFactor;
    } else if (aptitude < this.attributeScalingLimit * 100){
      // from the 10x limit to 100x the limit, change growth rate to 1/20
      return (this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        ((aptitude - (this.attributeScalingLimit * 10)) / 20))  * empowermentFactor;
    } else if (aptitude < this.attributeSoftCap){
      // from the 100x limit to softcap, change growth rate to 1/100
      return (this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        (this.attributeScalingLimit * 90 / 20) +
        ((aptitude - (this.attributeScalingLimit * 100)) / 100)) * empowermentFactor;
    } else {
      // increase by aptitude / (1 + aptitude ^ pow) of whatever is over the softcap. 
      const pow = 0.6; // Power can be balanced as needed. Higher power reduces returns.
      return (this.attributeScalingLimit + (this.attributeScalingLimit * 9 / 4) +
        (this.attributeScalingLimit * 90 / 20) +
        (this.attributeSoftCap - (this.attributeScalingLimit * 100)) / 100 +
        (aptitude - this.attributeSoftCap + 1) / (1 + Math.pow (aptitude - this.attributeSoftCap + 1, pow)) * this.attributeScalingLimit / 5120)  * empowermentFactor;
    }
  }

  increaseAttribute(attribute: AttributeType, amount: number): number {
    let increaseAmount = (amount * this.getAptitudeMultipier(this.attributes[attribute].aptitude));
    // sanity check that gain is never less than base gain
    if (increaseAmount < amount){
      increaseAmount = amount;
    }
    this.attributes[attribute].value += increaseAmount;
    return increaseAmount;
  }

  /**increase in days
   *
   * limit in years
   *
   * returns false if limit is reached.
  */
  increaseBaseLifespan(increase: number, limit: number): boolean {
    if (this.baseLifespan + increase < limit * 365){
      this.baseLifespan += increase;
      return true;
    } else if (this.baseLifespan < limit * 365) {
      this.baseLifespan = limit * 365;
    }
    return false;
  }

  checkOverage(){
    if (this.empowermentFactor > 1000){
      this.empowermentFactor = 1000;
    }
    if (this.healthBonusFood > 1900){
      this.healthBonusFood = 1900;
    }
    if (this.healthBonusBath > 8000){
      this.healthBonusBath = 8000;
    }
    if (this.healthBonusMagic > 10000){
      this.healthBonusMagic = 10000;
    }
    if (this.status.stamina.max > 1000000){
      this.status.stamina.max = 1000000;
    }
    if (this.status.health.value > this.status.health.max){
      this.status.health.value = this.status.health.max;
    }
    if (this.status.stamina.value > this.status.stamina.max){
      this.status.stamina.value = this.status.stamina.max;
    }
    if (this.status.nourishment.value > this.status.nourishment.max){
      this.status.nourishment.value = this.status.nourishment.max;
    }
    if (this.status.mana.value > this.status.mana.max){
      this.status.mana.value = this.status.mana.max;
    }
    if (this.money > this.maxMoney){
      this.money = this.maxMoney;
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
      alchemyLifespan: this.alchemyLifespan,
      statLifespan: this.statLifespan,
      spiritualityLifespan: this.spiritualityLifespan,
      magicLifespan: this.magicLifespan,
      attributeScalingLimit: this.attributeScalingLimit,
      attributeSoftCap: this.attributeSoftCap,
      aptitudeGainDivider: this.aptitudeGainDivider,
      condenseSoulCoreCost: this.condenseSoulCoreCost,
      reinforceMeridiansCost: this.reinforceMeridiansCost,
      bloodlineCost: this.bloodlineCost,
      bloodlineRank: this.bloodlineRank,
      manaUnlocked: this.manaUnlocked,
      totalLives: this.totalLives,
      healthBonusFood: this.healthBonusFood,
      healthBonusBath: this.healthBonusBath,
      healthBonusMagic: this.healthBonusMagic,
      empowermentFactor: this.empowermentFactor,
      immortal: this.immortal
    }
  }

  setProperties(properties: CharacterProperties): void {
    this.attributes = properties.attributes;
    this.money = properties.money;
    if (this.money > this.maxMoney){
      this.money = this.maxMoney;
    }
    this.equipment = properties.equipment;
    this.age = properties.age || INITIAL_AGE;
    this.status = properties.status;
    this.baseLifespan = properties.baseLifespan;
    this.foodLifespan = properties.foodLifespan || 0;
    this.alchemyLifespan = properties.alchemyLifespan || 0;
    this.statLifespan = properties.statLifespan || 0;
    this.spiritualityLifespan = properties.spiritualityLifespan || 0;
    this.magicLifespan = properties.magicLifespan || 0;
    this.attributeScalingLimit = properties.attributeScalingLimit;
    this.attributeSoftCap = properties.attributeSoftCap;
    this.aptitudeGainDivider = properties.aptitudeGainDivider;
    this.condenseSoulCoreCost = properties.condenseSoulCoreCost;
    this.reinforceMeridiansCost = properties.reinforceMeridiansCost;
    this.bloodlineCost = properties.bloodlineCost;
    this.bloodlineRank = properties.bloodlineRank;
    this.manaUnlocked = properties.manaUnlocked || false;
    this.totalLives = properties.totalLives || 1;
    this.healthBonusFood = properties.healthBonusFood || 0;
    this.healthBonusBath = properties.healthBonusBath || 0;
    this.healthBonusMagic = properties.healthBonusMagic || 0;
    this.empowermentFactor = properties.empowermentFactor || 1;
    this.immortal = properties.immortal || false;
    this.recalculateDerivedStats();
  }
}

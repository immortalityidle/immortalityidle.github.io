import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { Character, AttributeType } from './character';
import { TitleCasePipe } from '@angular/common';
import { ActivityService } from './activity.service';
import { Subscription } from "rxjs";
import { BigNumberPipe } from '../app.component';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  bigNumberPipe = new BigNumberPipe;
  activityService?: ActivityService;
  characterState: Character;
  forceRebirth = false;
  fatherGift = false;
  lifespanTooltip = "";
  deathSubscriber?: Subscription;

  constructor(
    private injector: Injector,
    private mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    titleCasePipe: TitleCasePipe
  ) {
    this.characterState = new Character(logService, titleCasePipe, mainLoopService);
    mainLoopService.tickSubject.subscribe(() => {
      if (this.mainLoopService.totalTicks % 3650 === 0){
        this.characterState.increaseBaseLifespan(1, 70); //bonus day for living another 10 years, capped at 70 years
      }
      if (!this.characterState.dead){
        this.characterState.age++;
        this.characterState.status.nourishment.value--;
      }
      // check for death
      let deathMessage = "";
      if (this.forceRebirth){
        deathMessage = "You release your soul from your body at the age of " + this.formatAge() + ".";
      } else if (this.characterState.age >= this.characterState.lifespan && !this.characterState.immortal) {
        deathMessage = "You reach the end of your natural life and pass away from natural causes at the age of " + this.formatAge() + ".";
      } else if (this.characterState.status.nourishment.value <= 0) {
        this.characterState.status.nourishment.value = 0;
        if (this.characterState.attributes.spirituality.value > 0){
          // you're spritual now, you can fast!
          let starvationDamage = Math.max(this.characterState.status.health.value * 0.2, 20);
          logService.addLogMessage("You take " + starvationDamage + " damage from starvation.", "INJURY", "EVENT");
          this.characterState.status.health.value -= starvationDamage;
          this.characterState.increaseAttribute('spirituality', 0.1);
          if (this.characterState.status.health.value <= 0 && !this.characterState.immortal) {
            deathMessage = "You starve to death at the age of " + this.formatAge() + ".";
          }
        } else if (!this.characterState.immortal) {
          deathMessage = "You starve to death at the age of " + this.formatAge() + ".";
        }
      } else if (this.characterState.status.health.value <= 0 && !this.characterState.immortal) {
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        if (this.activityService.activityDeath){
          deathMessage = "You die from overwork at the age of " + this.formatAge() + ".";
        } else {
          deathMessage = "You succumb to your wounds and die at the age of " + this.formatAge() + ".";
        }
      } else if (this.characterState.immortal && this.characterState.status.health.value < 0) {
        this.characterState.status.health.value = 0;
      }
      if (deathMessage !== ""){
        if (!this.characterState.immortal){
          this.logService.addLogMessage(deathMessage, 'INJURY', 'EVENT');
          if (!this.forceRebirth){
            this.logService.addLogMessage(
              "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life.",
              'STANDARD', 'EVENT');
          }
        }
        this.characterState.dead = true;
        this.characterState.reincarnate(); // make sure character reincarnation fires before other things reset
        this.reincarnationService.reincarnate();
        // Revive the character in the next tick update for making sure that everything is stopped.
        this.deathSubscriber = this.mainLoopService.tickSubject.subscribe(() => {
          this.characterState.dead = false;
          this.deathSubscriber?.unsubscribe();
        });
        this.forceRebirth = false;
        if (this.characterState.immortal){
          this.logService.addLogMessage("You are born anew, still an immortal but with the fresh vigor of youth.", 'STANDARD', 'EVENT');
        } else {
          this.logService.addLogMessage(
            "Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again. You are certain that lucky life number " + this.characterState.totalLives + " will be the one.",
            'STANDARD', 'EVENT');
          this.logService.addLogMessage(
            "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!",
            'STANDARD', 'EVENT');
        }
      }
    });

    mainLoopService.longTickSubject.subscribe(() => {

      if (this.characterState.highestMoney < this.characterState.money){
        this.characterState.highestMoney = this.characterState.money;
      }
      if (this.characterState.highestAge < this.characterState.age){
        this.characterState.highestAge = this.characterState.age;
      }
      if (this.characterState.highestHealth < this.characterState.status.health.value){
        this.characterState.highestHealth = this.characterState.status.health.value;
      }
      if (this.characterState.highestStamina < this.characterState.status.stamina.value){
        this.characterState.highestStamina = this.characterState.status.stamina.value;
      }
      if (this.characterState.highestMana < this.characterState.status.mana.value){
        this.characterState.highestMana = this.characterState.status.mana.value;
      }
    
      if (this.characterState.dead){
        return;
      }
      this.characterState.recalculateDerivedStats();
      this.setLifespanTooltip();
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      if (this.fatherGift && this.characterState.bloodlineRank < 6){ // Skip the family gifts, it's not thematic.
        this.logService.addLogMessage("Your father puts some coins in your purse before sending you on your way.",
          'STANDARD', 'EVENT');
        this.characterState.money += 200;
      }
    });

  }

  formatAge(): string{
    const years = Math.floor(this.characterState.age / 365);
    const days = this.characterState.age % 365;
    return years + " years, " + days + " days"
  }

  setLifespanTooltip(){
    if (this.characterState.foodLifespan + this.characterState.alchemyLifespan + this.characterState.statLifespan + this.characterState.spiritualityLifespan + this.characterState.magicLifespan <= 0){
      this.lifespanTooltip = "You have done nothing to extend your lifespan.";
      return;
    }
    let tooltip = "Your base lifespan of " + this.yearify(this.characterState.baseLifespan) + " is extended by"
    if (this.characterState.immortal){
      tooltip = "You are immortal. If you had remained mortal, your base lifespan of " + this.yearify(this.characterState.baseLifespan) + " would be extended by"
    }
    if (this.characterState.foodLifespan > 0){
      tooltip += "<br>Healthy Food: " + this.yearify(this.characterState.foodLifespan);
    }
    if (this.characterState.alchemyLifespan > 0){
      tooltip += "<br>Alchemy: " + this.yearify(this.characterState.alchemyLifespan);
    }
    if (this.characterState.statLifespan > 0){
      tooltip += "<br>Basic Attributes: " + this.yearify(this.characterState.statLifespan);
    }
    if (this.characterState.spiritualityLifespan > 0){
      tooltip += "<br>Spirituality: " + this.yearify(this.characterState.spiritualityLifespan);
    }
    if (this.characterState.magicLifespan > 0){
      tooltip += "<br>Magic: " + this.yearify(this.characterState.magicLifespan);
    }
    this.lifespanTooltip = tooltip;
  }

  yearify(value: number){
    if (value < 365){
      return "< 1 year";
    } else if (value < 730){
      return "1 year";
    } else {
      return this.bigNumberPipe.transform(Math.floor(value / 365)) + " years";
    }
  }

  resetAptitudes(){
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      const attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1 + attribute.aptitude / this.characterState.aptitudeGainDivider; // keep up to 20% of aptitudes after Ascension
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    if (!this.activityService){
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
    this.activityService.activityLoop.splice(0, this.activityService.activityLoop.length);
    this.forceRebirth = true;
    this.mainLoopService.tick();
  }

  condenseSoulCore(){
    if (this.characterState.aptitudeGainDivider <= 5){
      // double check we're not going over the max rank
      return;
    }
    this.logService.addLogMessage(
      "Your spirituality coelesces around the core of your soul, strengthening it and reforging it into something stronger.",
      'STANDARD', 'STORY');
    this.logService.addLogMessage(
      "You now gain additional aptitude each time you reincarnate.",
      'STANDARD', 'STORY');
    this.characterState.condenseSoulCoreCost *= 10;
    this.characterState.aptitudeGainDivider /= 1.5;
    this.resetAptitudes();
  }

  soulCoreRank(): number {
    return Math.log10(this.characterState.condenseSoulCoreCost / this.characterState.condenseSoulCoreOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  reinforceMeridians(){
    if (this.characterState.attributeScalingLimit >= 10240){
      // double check we're not going over the max rank
      return;
    }
    this.logService.addLogMessage(
      "The pathways that carry your chi through your body have been strengthened and reinforced.",
      'STANDARD', 'STORY');
      this.logService.addLogMessage(
        "Your aptitudes can now give you a greater increase when gaining attributes.",
        'STANDARD', 'STORY');

    this.characterState.reinforceMeridiansCost *= 10;
    this.characterState.attributeScalingLimit *= 2;
    this.resetAptitudes();
  }

  meridianRank(): number {
    return Math.log10(this.characterState.reinforceMeridiansCost / this.characterState.reinforceMeridiansOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  upgradeBloodline() {
    if (this.characterState.bloodlineRank >= 9){
      // double check we're not going over the max rank
      return;
    }
    this.logService.addLogMessage(
      "You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.",
      'STANDARD', 'STORY');
    this.logService.addLogMessage(
      "You will be reborn into your own family line and reap greater benefits from your previous lives.",
      'STANDARD', 'STORY');
    this.characterState.bloodlineCost *= 100;
    this.characterState.bloodlineRank++;
    this.resetAptitudes();
  }

  stashWeapons(){
    this.characterState.stashedEquipment.rightHand = this.characterState.equipment.rightHand;
    this.characterState.stashedEquipment.leftHand = this.characterState.equipment.leftHand;
    this.characterState.equipment.rightHand = null;
    this.characterState.equipment.leftHand = null;
  }

  restoreWeapons(){
    this.characterState.equipment.rightHand = this.characterState.stashedEquipment.rightHand;
    this.characterState.equipment.leftHand = this.characterState.stashedEquipment.leftHand;
    this.characterState.stashedEquipment.rightHand = null;
    this.characterState.stashedEquipment.leftHand = null;
  }

  stashMoney(){
    this.characterState.stashedMoney = this.characterState.money;
    this.characterState.money = 0
  }

  restoreMoney(){
    this.characterState.money = this.characterState.stashedMoney;
    this.characterState.stashedMoney = 0
  }
}

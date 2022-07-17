import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { Character, AttributeType } from './character';
import { formatNumber, TitleCasePipe } from '@angular/common';
import { ActivityService } from './activity.service';
import { Subscription } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  activityService?: ActivityService;
  characterState: Character;
  forceRebirth: boolean = false;
  fatherGift: boolean = false;
  lifespanTooltip: string = "";
  deathSubscriber?: Subscription;

  constructor(
    private injector: Injector,
    private mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    titleCasePipe: TitleCasePipe
  ) {
    this.characterState = new Character(logService, titleCasePipe);
    mainLoopService.tickSubject.subscribe(() => {
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
      } else if (this.characterState.status.nourishment.value <= 0 && !this.characterState.immortal) {
        if (this.characterState.attributes.spirituality.value > 0){
          // you're spritual now, you can fast!
          this.characterState.status.health.value -= 20;
          this.characterState.increaseAttribute('spirituality', 0.1);
          if (this.characterState.status.health.value <= 0) {
            deathMessage = "You starve to death at the age of " + this.formatAge() + ".";
          }
        } else {
          deathMessage = "You starve to death at the age of " + this.formatAge() + ".";
        }
      } else if (this.characterState.status.health.value <= 0 && !this.characterState.immortal) {
        deathMessage = "You succumb to your wounds and die at the age of " + this.formatAge() + ".";
      }
      if (deathMessage != ""){
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
      if (this.characterState.dead){
        return;
      }
      this.characterState.recalculateDerivedStats();
      this.setLifespanTooltip();
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      if (this.fatherGift){
        this.logService.addLogMessage("Your father puts some coins in your purse before sending you on your way.",
          'STANDARD', 'EVENT');
        this.characterState.money += 200;
      }
    });

  }

  formatAge(): string{
    let years = Math.floor(this.characterState.age / 365);
    let days = this.characterState.age % 365;
    return years + " years, " + days + " days"
  }

  setLifespanTooltip(){
    if (this.characterState.immortal){
      this.lifespanTooltip = "You are immortal.";
      return;
    }
    if (this.characterState.foodLifespan + this.characterState.alchemyLifespan + this.characterState.statLifespan + this.characterState.spiritualityLifespan + this.characterState.magicLifespan <= 0){
      this.lifespanTooltip = "You have done nothing to extend your lifespan.";
      return;
    }
    let tooltip = "Your base lifespan of " + this.yearify(this.characterState.baseLifespan) + " is extended by"
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
    if (this.characterState.spiritualityLifespan > 0){
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
      return Math.floor(value / 365) + " years";
    }
  }


  condenseSoulCore(){
    if (this.characterState.aptitudeGainDivider <= 10){
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
    this.characterState.aptitudeGainDivider -= 10;
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1;
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

  soulCoreRank(): number {
    let rank = 0;
    let cost = this.characterState.condenseSoulCoreOriginalCost;
    while (cost < this.characterState.condenseSoulCoreCost){
      cost *= 10;
      rank++;
    }
    return rank;
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
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1;
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

  meridianRank(): number {
    let rank = 0;
    let cost = this.characterState.reinforceMeridiansOriginalCost;
    while (cost < this.characterState.reinforceMeridiansCost){
      cost *= 10;
      rank++;
    }
    return rank;
  }

  upgradeBloodline() {
    if (this.characterState.bloodlineRank >= 5){
      // double check we're not going over the max rank
      return;
    }
    this.logService.addLogMessage(
      "You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.",
      'STANDARD', 'STORY');
    this.logService.addLogMessage(
      "You will be reborn into your own family line and reap greater benefits from your previous lives.",
      'STANDARD', 'STORY');
    this.characterState.bloodlineCost *= 1000;
    this.characterState.bloodlineRank++;
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1;
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    this.forceRebirth = true;
    this.mainLoopService.tick();
  }

}

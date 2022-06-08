import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { Character, AttributeType } from './character';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  characterState = new Character();
  forceRebirth: boolean = false;

  constructor(
    mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      this.characterState.totalTicks++;
      this.characterState.recalculateDerivedStats();
      this.characterState.dead = false;
      this.characterState.age++;
      this.characterState.status.nourishment.value--;
      // check for death
      let deathMessage = "";
      if (this.forceRebirth){
        deathMessage = "You release your soul from your body.";
      } else if (this.characterState.age >= this.characterState.lifespan) {
        deathMessage = "You reach the end of your natural life and pass away from old age.";
      } else if (this.characterState.status.nourishment.value <= 0) {
        if (this.characterState.attributes.spirituality.value > 0){
          // you're spritual now, you can fast!
          this.characterState.status.health.value -= 20;
          this.characterState.increaseAttribute('spirituality', 0.1);
          if (this.characterState.status.health.value <= 0) {
            deathMessage = "You starve to death.";
          }
        } else {
          deathMessage = "You starve to death.";
        }
      } else if (this.characterState.status.health.value <= 0) {
        deathMessage = "You succumb to your wounds and die.";
      }
      if (deathMessage != ""){
        this.logService.addLogMessage(deathMessage, 'INJURY', 'EVENT');
        if (!this.forceRebirth){
          this.logService.addLogMessage(
            "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life.",
            'STANDARD', 'EVENT');
        }
        this.logService.addLogMessage(
          "Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again.",
          'STANDARD', 'EVENT');
        this.logService.addLogMessage(
          "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!",
          'STANDARD', 'EVENT');
        this.reincarnationService.reincarnate();
        this.characterState.dead = true; // use this flag to stop other events until the next tick
        this.forceRebirth = false;
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.characterState.reincarnate();
      if (Math.random() < .3){
        this.logService.addLogMessage("Your father puts some coins in your purse before sending you on your way.",
          'STANDARD', 'EVENT');
        this.characterState.money += 100;
      }
    });

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
      "You now gain twice as much aptitude each time you reincarnate.",
      'STANDARD', 'STORY');
    this.characterState.condenseSoulCoreCost *= 10;
    this.characterState.aptitudeGainDivider -= 10;
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.aptitude = 1;
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    if (this.soulCoreRank() > 5 && this.meridianRank() > 4){
      this.characterState.followersUnlocked = true;
    }
    this.forceRebirth = true;
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
      attribute.aptitude = 1;
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    if (this.soulCoreRank() > 5 && this.meridianRank() > 4){
      this.characterState.followersUnlocked = true;
    }
    this.forceRebirth = true;
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
    if (this.characterState.bloodlineRank > 8){
      // double check we're not going over the max rank
      return;
    }
    this.logService.addLogMessage(
      "You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.",
      'STANDARD', 'STORY');
    this.logService.addLogMessage(
      "You will be reborn into your own family line and reap greater benefits from your previous lives.",
      'STANDARD', 'STORY');
    this.characterState.bloodlineCost *= 10;
    this.characterState.bloodlineRank++;
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterState.attributes[keys[key]];
      attribute.aptitude = 1;
      if (parseInt(key) < 5){
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    this.forceRebirth = true;
  }

}

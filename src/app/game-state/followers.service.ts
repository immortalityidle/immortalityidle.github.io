import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ReincarnationService } from './reincarnation.service';
import { BattleService } from './battle.service';
import { EquipmentPosition } from './character';

export interface Follower {
  name: string;
  age: number;
  lifespan: number;
  job: string;
  power: number;
  cost: number;
}

export interface FollowersProperties {
  followersUnlocked: boolean,
  followers: Follower[],
  autoDismissUnlocked: boolean,
  autoDismissJobs: string[],
}

type jobsType = {
  [key: string]: {
    work: (follower: Follower) => void,
    description: string
  }
};

@Injectable({
  providedIn: 'root'
})
export class FollowersService {

  followersUnlocked: boolean = false;
  followers: Follower[] = [];
  followersRecruited: number = 0;
  autoDismissUnlocked: boolean = false;
  autoDismissJobs: string[] = [];

  jobs: jobsType = {
    "builder": {
      work: (follower: Follower) => {
        this.homeService.nextHomeCostReduction += follower.power;
        for (let i = 0; i < follower.power; i++){
          if (this.homeService.upgrading){
            this.homeService.upgradeTick();
          }
        }
      },
      description: "Builders reduce the cost of the next home you upgrade to. They can also help you build it faster."
    },
    "hunter": {
      work: (follower: Follower) => {
        for (let i = 0; i < follower.power; i++){
          this.inventoryService.addItem(this.itemRepoService.items['meat']);
          this.inventoryService.addItem(this.itemRepoService.items['hide']);
        }
      },
      description: "Hunters collect meat and hides for you."
    },
    "farmer": {
      work: (follower: Follower) => {
        this.homeService.workFields(follower.power);
      },
    description: "Farmers work your fields, helping your crops to grow."
    },
    "weaponsmith": {
      work: (follower: Follower) => {
        if (this.characterService.characterState.equipment.rightHand && 
          this.characterService.characterState.equipment.rightHand.weaponStats){
          this.characterService.characterState.equipment.rightHand.weaponStats.durability += follower.power;
          this.characterService.characterState.equipment.rightHand.weaponStats.baseDamage += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.rightHand.value += Math.floor(follower.power/10);
        }
        if (this.characterService.characterState.equipment.leftHand && 
          this.characterService.characterState.equipment.leftHand.weaponStats){
          this.characterService.characterState.equipment.leftHand.weaponStats.durability += follower.power;
          this.characterService.characterState.equipment.leftHand.weaponStats.baseDamage += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.leftHand.value += Math.floor(follower.power/10);
        }
      },
      description: "Weaponsmiths help you take care of your currently equipped weapons, adding durability to them each day."
    },
    "armorer": {
      work: (follower: Follower) => {
        if (this.characterService.characterState.equipment.head && 
          this.characterService.characterState.equipment.head.armorStats){
          this.characterService.characterState.equipment.head.armorStats.durability += follower.power;
          this.characterService.characterState.equipment.head.armorStats.defense += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.head.value += Math.floor(follower.power/10);
        }
        if (this.characterService.characterState.equipment.body && 
          this.characterService.characterState.equipment.body.armorStats){
          this.characterService.characterState.equipment.body.armorStats.durability += follower.power;
          this.characterService.characterState.equipment.body.armorStats.defense += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.body.value += Math.floor(follower.power/10);
        }
        if (this.characterService.characterState.equipment.legs && 
          this.characterService.characterState.equipment.legs.armorStats){
          this.characterService.characterState.equipment.legs.armorStats.durability += follower.power;
          this.characterService.characterState.equipment.legs.armorStats.defense += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.legs.value += Math.floor(follower.power/10);
        }
        if (this.characterService.characterState.equipment.feet && 
          this.characterService.characterState.equipment.feet.armorStats){
          this.characterService.characterState.equipment.feet.armorStats.durability += follower.power;
          this.characterService.characterState.equipment.feet.armorStats.defense += Math.floor(follower.power/10);
          this.characterService.characterState.equipment.feet.value += Math.floor(follower.power/10);
        }
      },
      description: "Armorers help you take care of your currently equipped pieces of armor, adding durability to them each day."
    },
    "brawler": {
      work: (follower: Follower) => {
        this.characterService.characterState.increaseAttribute("strength", follower.power);
      },
      description: "Brawlers will spar with you in wrestling and boxing matches, increasing your strength."
    },
    "sprinter": {
      work: (follower: Follower) => {
        this.characterService.characterState.increaseAttribute("speed", follower.power);
      },
      description: "Sprinters challenge you to footraces and help you increase your speed."
    },
    "trainer": {
      work: (follower: Follower) => {

        this.characterService.characterState.increaseAttribute("toughness", follower.power);
      },
      description: "Trainers make sure you follow their strict fitness and diet rules, increasing your toughness."
    },
    "tutor": {
      work: (follower: Follower) => {
        this.characterService.characterState.increaseAttribute("intelligence", follower.power);
      },
      description: "Tutors teach you all about the wonders of the universe, increasing your intelligence."
    },
    "mediator": {
      work: (follower: Follower) => {
        this.characterService.characterState.increaseAttribute("charisma", follower.power);
      },
      description: "Mediators teach you how to persuade others, increasing your charisma."
    },
    "priest": {
      work: (follower: Follower) => {
        this.characterService.characterState.increaseAttribute("spirituality", follower.power);
      },
      description: "Priests help you get closer to the divine, increasing your sprituality."
    },
    "gemologist": {
      work: (follower: Follower) => {
        for (let i = 0; i < follower.power; i++){
          this.inventoryService.mergeAnySpiritGem();
        }
      },
      description: "Gemologists combine monster gems into higher grades."
    },
    "scout": {
      work: (follower: Follower) => {
        for (let i = 0; i < follower.power; i++){
          this.battleService.tickCounter++;
        }
      },
      description: "Scouts help you track down and fight monsters faster."
    }
  };

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private battleService: BattleService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (!this.followersUnlocked){
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.characterService.characterState.age % 18250 == 0){
        // another 50xth birthday, you get a follower
        this.generateFollower();
      }
      for (let i = this.followers.length - 1; i >= 0; i--){
        this.followerWorks(this.followers[i]);
        this.followers[i].age++;
        if (this.followers[i].age >= this.followers[i].lifespan){
          // follower aged off
          this.followers.splice(i,1);
        } else {
          this.characterService.characterState.money -= this.followers[i].cost;
        }
      }
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  followerWorks(follower: Follower){
    this.jobs[follower.job].work(follower);
  }

  reset() {
    this.followers.splice(0, this.followers.length);
    this.followersRecruited = 0;
  }

  getProperties(): FollowersProperties {
    return {
      followersUnlocked: this.followersUnlocked,
      followers: this.followers,
      autoDismissUnlocked: this.autoDismissUnlocked,
      autoDismissJobs: this.autoDismissJobs
    }
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
    this.followersUnlocked = properties.followersUnlocked || false;
    this.autoDismissUnlocked = properties.autoDismissUnlocked || false;
    this.autoDismissJobs = properties.autoDismissJobs || [];
  }

  generateFollower(){
    this.followersRecruited++;
    let maxFollowers = 1 + (this.homeService.homeValue * 3) + this.characterService.meridianRank() + this.characterService.soulCoreRank() + this.characterService.characterState.bloodlineRank;
    if (this.followers.length >= maxFollowers){
      this.logService.addLogMessage("A new follower shows up, but you already have too many. You are forced to turn them away.","INJURY","EVENT");
      return;
    }

    let job = this.generateFollowerJob();
    if (this.autoDismissJobs.includes(job)){
      this.logService.addLogMessage("A new follower shows up, but they were a " + job + " and you don't want any of those.","STANDARD","EVENT");
      return;
    }

    this.logService.addLogMessage("A new follower has come to learn at your feet.","STANDARD","EVENT");
    this.followers.push({
      name: this.generateFollowerName(),
      age: 0,
      lifespan: this.characterService.characterState.lifespan / 10,
      job: job,
      power: 1,
      cost: 100
    });
  }

  generateFollowerName(): string {
    return FirstNames[Math.floor(Math.random() * FirstNames.length)];
    
  }
  generateFollowerJob(): string {
    const keys = Object.keys(this.jobs);
    return keys[Math.floor(Math.random() * keys.length)];    
  }

  dismissFollower(follower: Follower){
    let index = this.followers.indexOf(follower);
    this.followers.splice(index, 1);
  }

  dismissFollowerJob(job: string){
    if (!this.autoDismissJobs.includes(job)){
      this.autoDismissJobs.push(job);
    }
    for (let index = this.followers.length - 1; index >= 0; index--){
      if (this.followers[index].job == job){
        this.followers.splice(index, 1);
      }
    }
  }

  unAutoDismiss(job: string){
    if (!this.autoDismissJobs.includes(job)){
      return;
    }
    for (let index = this.autoDismissJobs.length - 1; index >= 0; index--){
      if (this.autoDismissJobs[index] == job){
        this.autoDismissJobs.splice(index, 1);
      }
    }
  }

}

import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from '../main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ReincarnationService } from './reincarnation.service';

export interface Follower {
  name: string;
  age: number;
  lifespan: number;
  job: string;
  power: number;
}

export interface FollowersProperties {
  followers: Follower[]
}

type jobsType = {[key: string]: (follower: Follower) => void};

@Injectable({
  providedIn: 'root'
})
export class FollowersService {

  followers: Follower[] = [];
  jobs: jobsType = {
    "builder": (follower: Follower) => {
      this.homeService.nextHomeCostReduction += follower.power;
      for (let i = 0; i < follower.power; i++){
        if (this.homeService.upgrading){
          this.homeService.upgradeTick();
        }
      }
    },
    "hunter": (follower: Follower) => {
      for (let i = 0; i < follower.power; i++){
        this.inventoryService.addItem(this.itemRepoService.items['meat']);
        this.inventoryService.addItem(this.itemRepoService.items['hide']);
      }
    },
    "farmer": (follower: Follower) => {
      this.homeService.workFields(follower.power);
    }, 
    "weaponsmith": (follower: Follower) => {
      if (this.characterService.characterState.equipment.rightHand && 
        this.characterService.characterState.equipment.rightHand.weaponStats){
        this.characterService.characterState.equipment.rightHand.weaponStats.durability += follower.power;
      }
      if (this.characterService.characterState.equipment.leftHand && 
        this.characterService.characterState.equipment.leftHand.weaponStats){
        this.characterService.characterState.equipment.leftHand.weaponStats.durability += follower.power;
      }
    },
    "armorer": (follower: Follower) => {
      if (this.characterService.characterState.equipment.head && 
        this.characterService.characterState.equipment.head.armorStats){
        this.characterService.characterState.equipment.head.armorStats.durability += follower.power;
      }
      if (this.characterService.characterState.equipment.body && 
        this.characterService.characterState.equipment.body.armorStats){
        this.characterService.characterState.equipment.body.armorStats.durability += follower.power;
      }
      if (this.characterService.characterState.equipment.legs && 
        this.characterService.characterState.equipment.legs.armorStats){
        this.characterService.characterState.equipment.legs.armorStats.durability += follower.power;
      }
      if (this.characterService.characterState.equipment.feet && 
        this.characterService.characterState.equipment.feet.armorStats){
        this.characterService.characterState.equipment.feet.armorStats.durability += follower.power;
      }
    },
    "brawler": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("strength", follower.power);
    },
    "sprinter": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("speed", follower.power);
    },
    "trainer": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("toughness", follower.power);
    },
    "tutor": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("intelligence", follower.power);
    },
    "mediator": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("charisma", follower.power);
    },
    "priest": (follower: Follower) => {
      this.characterService.characterState.increaseAttribute("spirituality", follower.power);
    }
  };

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (!this.characterService.characterState.followersUnlocked){
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.characterService.characterState.age % 36500 == 0){
        // another 100xth birthday, you get a follower
        this.generateFollower();
      }
      for (let i = this.followers.length - 1; i >= 0; i--){
        this.followerWorks(this.followers[i]);
        this.followers[i].age++;
        if (this.followers[i].age >= this.followers[i].lifespan){
          // follower aged off
          this.followers.splice(i,1);
        }
      }
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  followerWorks(follower: Follower){
    this.jobs[follower.job](follower);
  }

  reset() {
    this.followers.splice(0, this.followers.length);
  }

  getProperties(): FollowersProperties {
    return {
      followers: this.followers,
    }
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
  }

  generateFollower(){
    this.logService.addLogMessage("A new follower has come to learn at your feet.","STANDARD","EVENT");
    this.followers.push({
      name: this.generateFollowerName(),
      age: 0,
      lifespan: this.characterService.characterState.lifespan / 100,
      job: this.generateFollowerJob(),
      power: 1
    });
  }

  generateFollowerName(): string {
    return FirstNames[Math.floor(Math.random() * FirstNames.length)];
    
  }
  generateFollowerJob(): string {
    const keys = Object.keys(this.jobs);
    return keys[Math.floor(Math.random() * keys.length)];    
  }
}

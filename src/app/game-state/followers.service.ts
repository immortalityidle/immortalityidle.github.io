/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ReincarnationService } from './reincarnation.service';
import { BattleService } from './battle.service';
import { HellService } from './hell.service';
import { EquipmentPosition } from './character';

export type FollowerColor = 'UNMAXED' | 'MAXED';

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
  maxFollowerByType: { [key: string]: number; },
  sortField: string,
  sortAscending: boolean,
  totalRecruited: number,
  totalDied: number,
  totalDismissed: number,
  highestLevel: number,
  stashedFollowers: Follower[],
}

export interface FollowerReserve {
  job: string,
  reserve: number
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

  followersUnlocked = false;
  followerLifespanDoubled = false; // achievement
  followers: Follower[] = [];
  stashedFollowers: Follower[] = [];
  followersRecruited = 0;
  autoDismissUnlocked = false;
  maxFollowerByType: { [key: string]: number; } = {};
  followerCap = 0;
  followersMaxed : FollowerColor = 'UNMAXED'; // for front-end follower count number colorizing
  sortField = "Job";
  sortAscending = true;
  totalRecruited = 0;
  totalDied = 0;
  totalDismissed = 0;
  highestLevel = 0;
  nonRandomJobs = 1;
  hellService?: HellService;
  gemsMerged = false;

  jobs: jobsType = {
    "builder": {
      work: (follower: Follower) => {
        this.homeService.nextHomeCostReduction += follower.power;
        if (this.homeService.upgrading){
          this.homeService.upgradeTick(follower.power);
        }
      },
      description: "Builders reduce the cost of the next home you upgrade to. They can also help you build it faster."
    },
    "hunter": {
      work: (follower: Follower) => {
        this.inventoryService.addItem(this.itemRepoService.items['meat'], follower.power);
        this.inventoryService.addItem(this.itemRepoService.items['hide'], follower.power);
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
        const rightHand = this.characterService.characterState.equipment.rightHand;
        const leftHand = this.characterService.characterState.equipment.leftHand;
        if (rightHand && rightHand.weaponStats){ 
          rightHand.weaponStats.durability += Math.floor(follower.power);
          rightHand.weaponStats.baseDamage += Math.floor(follower.power / 10);
          rightHand.value += Math.floor(follower.power / 10);
        }
        if (leftHand && leftHand.weaponStats){ 
          leftHand.weaponStats.durability += Math.floor(follower.power);
          leftHand.weaponStats.baseDamage += Math.floor(follower.power / 10);
          leftHand.value += Math.floor(follower.power / 10);
        }
        
      },
      description: "Weaponsmiths help you take care of your currently equipped weapons, adding durability to them each day. Higher levels can also help improve them."
    },
    "armorer": {
      work: (follower: Follower) => {
        const equipment = this.characterService.characterState.equipment; // Too many long names, reduced and referenced
        for (const key of ["head","body","legs","feet"] as EquipmentPosition[]){
          if (equipment[key] && equipment[key]!.armorStats){ // c = sqrt(a^2 + b^2) Pythagorean merging
            equipment[key]!.armorStats!.durability += Math.floor(follower.power);
            equipment[key]!.armorStats!.defense += Math.floor(follower.power / 10);
            equipment[key]!.value += Math.floor(follower.power / 10);
          }
        }
      },
      description: "Armorers help you take care of your currently equipped pieces of armor, adding durability to them each day. Higher levels can also help improve them."
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
      work: () => {
        let gemmerPower = 0;
        for (const follower of this.followers){
          if (follower.job === "gemologist"){
            gemmerPower += follower.power;
          }
        }
        gemmerPower = Math.floor(gemmerPower/50);
        if (gemmerPower > 4){
          gemmerPower = 4;
        }
        this.inventoryService.mergeAnySpiritGem(gemmerPower);
        this.gemsMerged = true;
      },
      description: "Gemologists combine monster gems into higher grades."
    },
    "scout": {
      work: (follower: Follower) => {
        this.battleService.tickCounter += follower.power;
      },
      description: "Scouts help you track down and fight monsters faster."
    },
    //Jobs after this will not be randomly selected. If you add jobs to this section, add one to this.nonRandomJobs
    "damned": {
      work: (follower: Follower) => {
        this.battleService.tickCounter += follower.power;
      },
      description: "A soul working off karmic debt in hell that has decided to join you"
    },
  };

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private battleService: BattleService,
    
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (!this.followersUnlocked){
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      this.updateFollowerCap();
      if (!this.hellService){
        this.hellService = this.injector.get(HellService);
      }
      if (this.characterService.characterState.age % 18250 === 0 && !this.hellService.inHell){
        // another 50xth birthday, you get a follower
        this.generateFollower();
      }
      this.gemsMerged = false;
      for (let i = this.followers.length - 1; i >= 0; i--){
        if (this.followers[i].job === "gemologist" && this.gemsMerged){
          // gemologists should only act once per tick
          continue;
        }
        this.followerWorks(this.followers[i]);
        this.followers[i].age++;
        if (this.followers[i].age >= this.followers[i].lifespan){
          // follower aged off
          this.totalDied++;
          this.logService.addLogMessage("Your follower " + this.followers[i].name + " passed away from old age.", "INJURY", "FOLLOWER");
          this.followers.splice(i,1);
        } else if (this.characterService.characterState.money < this.followers[i].cost){
          // quit from not being paid
          this.totalDismissed++;
          this.logService.addLogMessage("You didn't have enough money to suppport your follower " + this.followers[i].name + " so they left your service.", "INJURY", "FOLLOWER");
          this.followers.splice(i,1);
        } else {
          this.characterService.characterState.money -= this.followers[i].cost;
        }
      }
      this.followersMaxed = this.followers.length < this.followerCap ? this.followersMaxed = 'UNMAXED' : this.followersMaxed = 'MAXED';
    });

    mainLoopService.longTickSubject.subscribe(() => {
      this.sortFollowers(this.sortAscending);
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  updateFollowerCap(){
    this.followerCap = 1 + (this.homeService.homeValue * 3) + this.characterService.meridianRank() + this.characterService.soulCoreRank() + this.characterService.characterState.bloodlineRank;
    this.followersMaxed = this.followers.length < this.followerCap ? this.followersMaxed = 'UNMAXED' : this.followersMaxed = 'MAXED';
  }

  sortFollowers(ascending: boolean){
    let left = 1;
    let right = -1;
    if(!ascending){
      left = -1;
      right = 1;
    }
    if (this.sortField === "Remaining Life"){
      this.followers.sort((a, b) => (a.lifespan - a.age > b.lifespan - b.age) ? left : (a.lifespan - a.age === b.lifespan - b.age) ? 0 : right);
    } else {
      //@ts-ignore
      this.followers.sort((a, b) => (a[this.sortField.toLowerCase()] > b[this.sortField.toLowerCase()]) ? left : (a[this.sortField.toLowerCase()] === b[this.sortField.toLowerCase()]) ? 0 : right);
    }
  }

  followerWorks(follower: Follower){
    this.jobs[follower.job].work(follower);
  }

  reset() {
    if (this.characterService.characterState.bloodlineRank >= 7) {
      this.logService.addLogMessage("Your imperial entourage rejoins you as you set out.", "STANDARD", 'EVENT');
    } else {
      this.followers.splice(0, this.followers.length);
      this.followersMaxed = 'UNMAXED';
    }
    this.followersRecruited = 0;
  }

  getProperties(): FollowersProperties {
    return {
      followersUnlocked: this.followersUnlocked,
      followers: this.followers,
      stashedFollowers: this.stashedFollowers,
      autoDismissUnlocked: this.autoDismissUnlocked,
      maxFollowerByType: this.maxFollowerByType,
      sortField: this.sortField,
      sortAscending: this.sortAscending,
      totalRecruited: this.totalRecruited,
      totalDied: this.totalDied,
      totalDismissed: this.totalDismissed,
      highestLevel: this.highestLevel
    }
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
    this.stashedFollowers = properties.stashedFollowers || [];
    this.followersUnlocked = properties.followersUnlocked || false;
    this.autoDismissUnlocked = properties.autoDismissUnlocked || false;
    this.maxFollowerByType = properties.maxFollowerByType || {};
    this.sortField = properties.sortField || "Job";
    if (properties.sortAscending === undefined){
      this.sortAscending = true;
    } else {
      this.sortAscending = properties.sortAscending;
    }
    this.totalRecruited = properties.totalRecruited || 0;
    this.totalDied = properties.totalDied || 0;
    this.totalDismissed = properties.totalDismissed || 0;
    this.highestLevel = properties.highestLevel || 0;
  }

  generateFollower(job?: Follower["job"]){
    this.totalRecruited++;
    this.followersRecruited++;
    if (this.followers.length >= this.followerCap){
      this.logService.addLogMessage("A new follower shows up, but you already have too many. You are forced to turn them away.","INJURY","FOLLOWER");
      this.followersMaxed = 'MAXED'; // Sanity check, true check below.
      return;
    }

    job = job ? job : this.generateFollowerJob();
    let capNumber = 1000;
    let currentCount = 0;
    if (this.maxFollowerByType[job] !== undefined){
      capNumber = this.maxFollowerByType[job];
    }
    for (const follower of this.followers){
      if (follower.job === job){
        currentCount++;
      }
    }

    if (currentCount >= capNumber){
      this.logService.addLogMessage("A new follower shows up, but they were a " + job + " and you don't want any more of those.","STANDARD","FOLLOWER");
      this.totalDismissed++;
      return;
    }
    
    const lifespanDivider = this.followerLifespanDoubled ? 5 : 10;
    this.logService.addLogMessage("A new " + job + " has come to learn at your feet.","STANDARD","FOLLOWER");
    this.followers.push({
      name: this.generateFollowerName(),
      age: 0,
      lifespan: this.characterService.characterState.lifespan / lifespanDivider,
      job: job,
      power: 1,
      cost: 100
    });
    this.sortFollowers(this.sortAscending);
    if (this.followers.length >= this.followerCap){
      this.followersMaxed = 'MAXED';
    }
  }

  generateFollowerName(): string {
    return FirstNames[Math.floor(Math.random() * FirstNames.length)];

  }
  generateFollowerJob(): string {
    const keys = Object.keys(this.jobs);
    return keys[Math.floor(Math.random() * (keys.length - this.nonRandomJobs))];
  }

  /**
   * 
   * @param follower the Follower interface of the selected follower.
   * 
   */
  dismissFollower(follower: Follower){
    this.totalDismissed++;
    const index = this.followers.indexOf(follower);
    this.followers.splice(index, 1);
    this.followersMaxed = 'UNMAXED';
  }

  dismissFollowerAll(follower: Follower){
    this.totalDismissed += this.followers.length;
    for (let index = this.followers.length - 1; index >= 0; index--){
      if (this.followers[index].job === follower.job){
        this.followers.splice(index, 1);
      }
    }
    this.maxFollowerByType[follower.job] = 0;
    this.followersMaxed = 'UNMAXED';
  }

  limitFollower(follower: Follower){
    let count = 0;
      for (let index = this.followers.length - 1; index >= 0; index--){
        if (this.followers[index].job === follower.job){
          count++
        }
      }
    this.maxFollowerByType[follower.job] = count;
  }

  setMaxFollowers(job: string, value: number){
    if(!value || value < 0){
      this.maxFollowerByType[job] = 0; // In case of negatives, NaN or undefined.
    } else {
     this.maxFollowerByType[job] = value;
    }
  }

  stashFollowers(){
    this.stashedFollowers = this.followers;
    this.followers = [];
  }

  restoreFollowers(){
    this.followers = this.stashedFollowers;
    this.stashedFollowers = [];
  }
}

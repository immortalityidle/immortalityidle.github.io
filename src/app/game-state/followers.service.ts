/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from '@angular/core';
import { FirstNames } from './followerResources';
import { EquipmentPosition } from './character';
import { CamelToTitlePipe } from '../app.component';
import { ServicesService } from './services.service';

export type FollowerColor = 'UNMAXED' | 'MAXED';

export interface Follower {
  name: string;
  age: number;
  lifespan: number;
  job: string;
  power: number;
  cost: number;
  pet?: boolean;
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
  stashedFollowersMaxes: { [key: string]: number; },
  unlockedHiddenJobs: string[],
  autoReplaceUnlocked: boolean,
  petsEnabled: boolean,
  onlyWantedFollowers: boolean
}

export interface FollowerReserve {
  job: string,
  reserve: number
}

type jobsType = {
  [key: string]: {
    work: () => void,
    description: string,
    hidden?: boolean,
    pet?: boolean,
    totalPower: number
  }
};

@Injectable({
  providedIn: 'root'
})
export class FollowersService {
  camelToTitle = new CamelToTitlePipe();
  followersUnlocked = false;
  followerLifespanDoubled = false; // achievement
  followers: Follower[] = [];
  stashedFollowers: Follower[] = [];
  followersRecruited = 0;
  autoDismissUnlocked = false;
  maxFollowerByType: { [key: string]: number; } = {};
  stashedFollowersMaxes: { [key: string]: number; } = {};
  followerCap = 0;
  followersMaxed: FollowerColor = 'UNMAXED'; // for front-end follower count number colorizing
  sortField = "Job";
  sortAscending = true;
  totalRecruited = 0;
  totalDied = 0;
  totalDismissed = 0;
  highestLevel = 0;
  unlockedHiddenJobs: string[] = [];
  autoReplaceUnlocked = false;
  petsEnabled = false;
  onlyWantedFollowers = false;

  jobs: jobsType = {
    "builder": {
      work: () => {
        this.services.homeService.nextHomeCostReduction += this.jobs["builder"].totalPower;
        if (this.services.homeService.upgrading) {
          this.services.homeService.upgradeTick(this.jobs["builder"].totalPower);
        }
      },
      description: "Builders reduce the cost of the next home you upgrade to. They can also help you build it faster.",
      totalPower: 0
    },
    "hunter": {
      work: () => {
        if (this.services.hellService?.inHell) {
          if (this.jobs["hunter"].totalPower > 1000)
            this.services.inventoryService.addItem(this.services.itemRepoService.items['spiritMeat'], Math.floor(this.jobs["hunter"].totalPower / 1000));
          return;
        }
        this.services.inventoryService.addItem(this.services.itemRepoService.items['meat'], this.jobs["hunter"].totalPower);
      },
      description: "Hunters collect meat and help you hunt for hides.",
      totalPower: 0
    },
    "farmer": {
      work: () => {
        this.services.homeService.workFields(this.jobs["farmer"].totalPower);
      },
      description: "Farmers work your fields, helping your crops to grow.",
      totalPower: 0
    },
    "weaponsmith": {
      work: () => {
        let totalPower = this.jobs["weaponsmith"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        const rightHand = this.services.characterService.characterState.equipment.rightHand;
        const leftHand = this.services.characterService.characterState.equipment.leftHand;
        if (rightHand && rightHand.weaponStats) {
          rightHand.weaponStats.durability += Math.ceil(Math.pow((totalPower / 10), 2) * 100);
          rightHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2));
          rightHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2));
        }
        if (leftHand && leftHand.weaponStats){
          leftHand.weaponStats.durability += Math.ceil(Math.pow((totalPower / 10), 2) * 100);
          leftHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2));
          leftHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2));
        }

      },
      description: "Weaponsmiths help you take care of your currently equipped weapons, adding durability to them each day. Higher levels can also help improve them.",
      totalPower: 0
    },
    "armorer": {
      work: () => {
        let totalPower = this.jobs["armorer"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        const equipment = this.services.characterService.characterState.equipment; // Too many long names, reduced and referenced
        for (const key of ["head", "body", "legs", "feet"] as EquipmentPosition[]) {
          if (equipment[key] && equipment[key]!.armorStats) {
            equipment[key]!.armorStats!.durability += Math.ceil(Math.pow((totalPower / 10), 2) * 50);
            equipment[key]!.armorStats!.defense += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2);
            equipment[key]!.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2);
          }
        }
      },
      description: "Armorers help you take care of your currently equipped pieces of armor, adding durability to them each day. Higher levels can also help improve them.",
      totalPower: 0
    },
    "brawler": {
      work: () => {
        let totalPower = this.jobs["brawler"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("strength", totalPower);
      },
      description: "Brawlers will spar with you in wrestling and boxing matches, increasing your strength.",
      totalPower: 0
    },
    "sprinter": {
      work: () => {
        let totalPower = this.jobs["sprinter"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("speed", totalPower);
      },
      description: "Sprinters challenge you to footraces and help you increase your speed.",
      totalPower: 0
    },
    "trainer": {
      work: () => {
        let totalPower = this.jobs["trainer"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("toughness", totalPower);
      },
      description: "Trainers make sure you follow their strict fitness and diet rules, increasing your toughness.",
      totalPower: 0
    },
    "tutor": {
      work: () => {
        let totalPower = this.jobs["tutor"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("intelligence", totalPower);
      },
      description: "Tutors teach you all about the wonders of the universe, increasing your intelligence.",
      totalPower: 0
    },
    "mediator": {
      work: () => {
        let totalPower = this.jobs["mediator"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("charisma", totalPower);
      },
      description: "Mediators teach you how to persuade others, increasing your charisma.",
      totalPower: 0
    },
    "priest": {
      work: () => {
        let totalPower = this.jobs["priest"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.increaseAttribute("spirituality", totalPower);
      },
      description: "Priests help you get closer to the divine, increasing your sprituality.",
      totalPower: 0
    },
    "gemologist": {
      work: () => {
        let gemmerPower = this.jobs["gemologist"].totalPower;
        if (this.services.hellService?.inHell) {
          gemmerPower /= 10;
        }
        gemmerPower = Math.floor(gemmerPower / 50);
        if (gemmerPower > 4) {
          gemmerPower = 4;
        }
        this.services.inventoryService.mergeAnySpiritGem(gemmerPower);
      },
      description: "Gemologists combine spirit gems into higher grades.",
      totalPower: 0
    },
    "scout": {
      work: () => {
        let totalPower = this.jobs["scout"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.battleService.tickCounter += totalPower;
      },
      description: "Scouts help you track down and fight monsters faster.",
      totalPower: 0
    },
    "damned": {
      work: () => {
        this.services.battleService.tickCounter += this.jobs["damned"].totalPower;
      },
      description: "Damned are souls working off karmic debt in hell that hav decided to join you. Having this follower seems to enrage the demons around you.",
      hidden: true,
      totalPower: 0
    },
    "prophet": {
      work: () => {
        if (Math.random() < (this.jobs["prophet"].totalPower * .00001)) {
          this.generateFollower();
        }
      },
      description: "Prophets are dedicated to spreading the word of your greatness. Prophets can even find other followers for you if you are out of the mortal realm.",
      hidden: true,
      totalPower: 0
    },
    "moneyBurner": {
      work: () => {
        let burnerPower = this.jobs["moneyBurner"].totalPower;
        burnerPower = Math.floor(burnerPower / 50);
        if (burnerPower > 10) {
          burnerPower = 10;
        } else if (burnerPower < 1) {
          burnerPower = 1;
        }
        if (this.services.characterService.characterState.money < (1e6 / burnerPower)) {
          return;
        }
        this.services.characterService.characterState.money -= (1e6 / burnerPower);
        this.services.characterService.characterState.hellMoney++;
      },
      description: "Money Burners dedicate themselves to burning mortal money to produce hell money.",
      hidden: true,
      totalPower: 0
    },
    "banker": {
      work: () => {
        let totalPower = this.jobs["banker"].totalPower;
        if (this.services.hellService?.inHell) {
          totalPower /= 10;
        }
        this.services.characterService.characterState.money += this.services.characterService.characterState.money * 0.000000273 * totalPower;
        this.services.characterService.characterState.hellMoney += this.services.characterService.characterState.hellMoney * 0.000000273 * totalPower;
      },
      description: "Bankers put your money to use, earning interest on what you have. Surprisingly, this works for hell money too.",
      hidden: true,
      totalPower: 0
    },
    "snake": {
      work: () => {
        this.services.characterService.characterState.increaseAttribute("fireLore", this.jobs["snake"].totalPower);
      },
      description: "A fiery serpent. Snakes understand fire and can teach you the hidden secrets of the flames.",
      hidden: true,
      pet: true,
      totalPower: 0
    },
    "tiger": {
      work: () => {
        this.services.characterService.characterState.increaseAttribute("woodLore", this.jobs["tiger"].totalPower);
      },
      description: "Tigers know the secrets of the jungle and can teach you the deepest mysteries of Wood Lore.",
      hidden: true,
      pet: true,
      totalPower: 0
    },
    "ox": {
      work: () => {
        this.services.characterService.characterState.increaseAttribute("earthLore", this.jobs["ox"].totalPower);
      },
      description: "Oxen connect deeply to the earth and can teach you their secret understanding.",
      hidden: true,
      pet: true,
      totalPower: 0
    },
    "monkey": {
      work: () => {
        this.services.characterService.characterState.increaseAttribute("metalLore", this.jobs["monkey"].totalPower);
      },
      description: "Monkeys know more about metal than the greatest of human blacksmiths.",
      hidden: true,
      pet: true,
      totalPower: 0
    },
    "pig": {
      work: () => {
        this.services.characterService.characterState.increaseAttribute("waterLore", this.jobs["pig"].totalPower);
      },
      description: "Pigs understand the secrets of water and can teach them to you.",
      hidden: true,
      pet: true,
      totalPower: 0
    },
  };

  constructor(
    private services: ServicesService
  ) {}

  init(): FollowersService {
    this.services.mainLoopService.tickSubject.subscribe(() => {
      if (!this.followersUnlocked) {
        return;
      }
      if (this.services.characterService.characterState.dead) {
        return;
      }
      this.updateFollowerCap();
      if (this.services.characterService.characterState.age % 18250 === 0 && !this.services.hellService?.inHell) {
        // another 50xth birthday, you get a follower
        this.generateFollower();
      }
      for (let i = this.followers.length - 1; i >= 0; i--) {
        const follower = this.followers[i]
        follower.age++;
        if (follower.age >= this.followers[i].lifespan) {
          // follower aged off
          this.totalDied++;
          this.followers.splice(i, 1);
          if (this.autoReplaceUnlocked) {
            const newFollower = this.generateFollower(follower.pet, follower.job);
            if (newFollower) {
              newFollower.power = Math.round(follower.power / 2);
              newFollower.cost = 100 * newFollower.power;
              this.services.logService.addLogMessage("Your follower " + follower.name + " passed away from old age but was replaced by their child " + newFollower?.name + ".", "STANDARD", "FOLLOWER");
            }
            this.services.logService.addLogMessage("Your follower " + follower.name + " passed away from old age and was not replaced because of your choices in follower jobs.", "STANDARD", "FOLLOWER");
          } else {
            this.services.logService.addLogMessage("Your follower " + follower.name + " passed away from old age.", "INJURY", "FOLLOWER");
          }
          this.updateFollowerTotalPower();
        } else if (this.services.characterService.characterState.money < this.followers[i].cost && !this.services.hellService?.inHell) {
          // quit from not being paid
          this.totalDismissed++;
          this.services.logService.addLogMessage("You didn't have enough money to suppport your follower " + this.followers[i].name + " so they left your service.", "INJURY", "FOLLOWER");
          this.followers.splice(i, 1);
          this.updateFollowerTotalPower();
        } else if (!this.services.hellService?.inHell){
          this.services.characterService.characterState.money -= this.followers[i].cost;
        }
      }
      this.followersWorks();
      this.followersMaxed = this.followers.length < this.followerCap ? this.followersMaxed = 'UNMAXED' : this.followersMaxed = 'MAXED';
    });

    this.services.mainLoopService.longTickSubject.subscribe(() => {
      this.sortFollowers(this.sortAscending);
    });

    this.services.reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

    return this;
  }

  updateFollowerCap() {
    this.followerCap = 1 + (this.services.homeService.homeValue * 3) + this.services.characterService.meridianRank() + this.services.characterService.soulCoreRank() + this.services.characterService.characterState.bloodlineRank;
    this.followersMaxed = this.followers.length < this.followerCap ? this.followersMaxed = 'UNMAXED' : this.followersMaxed = 'MAXED';
  }

  updateFollowerTotalPower() {
    // before calculating total set it to zero for all
    for (const job of Object.keys(this.jobs)) {
      this.jobs[job].totalPower = 0;
    }
    for (let i = this.followers.length - 1; i >= 0; i--) {
      this.jobs[this.followers[i].job].totalPower += this.followers[i].power;
    }
  }

  sortFollowers(ascending: boolean) {
    let left = 1;
    let right = -1;
    if (!ascending) {
      left = -1;
      right = 1;
    }
    if (this.sortField === "Remaining Life") {
      this.followers.sort((a, b) => (a.lifespan - a.age > b.lifespan - b.age) ? left : (a.lifespan - a.age === b.lifespan - b.age) ? 0 : right);
    } else {
      //@ts-ignore
      this.followers.sort((a, b) => (a[this.sortField.toLowerCase()] > b[this.sortField.toLowerCase()]) ? left : (a[this.sortField.toLowerCase()] === b[this.sortField.toLowerCase()]) ? 0 : right);
    }
  }

  followersWorks() {
    for (const job of Object.keys(this.jobs)) {
      if (this.jobs[job].totalPower > 0) {
        this.jobs[job].work();
      }
    }
  }

  reset() {
    if (this.services.characterService.characterState.bloodlineRank >= 7) {
      this.services.logService.addLogMessage("Your imperial entourage rejoins you as you set out.", "STANDARD", 'EVENT');
    } else {
      this.followers.splice(0, this.followers.length);
      this.followersMaxed = 'UNMAXED';
    }
    this.followersRecruited = 0;
    this.updateFollowerTotalPower();
  }

  getProperties(): FollowersProperties {
    return {
      followersUnlocked: this.followersUnlocked,
      followers: this.followers,
      stashedFollowers: this.stashedFollowers,
      autoDismissUnlocked: this.autoDismissUnlocked,
      maxFollowerByType: this.maxFollowerByType,
      stashedFollowersMaxes: this.maxFollowerByType,
      sortField: this.sortField,
      sortAscending: this.sortAscending,
      totalRecruited: this.totalRecruited,
      totalDied: this.totalDied,
      totalDismissed: this.totalDismissed,
      highestLevel: this.highestLevel,
      unlockedHiddenJobs: this.unlockedHiddenJobs,
      autoReplaceUnlocked: this.autoReplaceUnlocked,
      petsEnabled: this.petsEnabled,
      onlyWantedFollowers: this.onlyWantedFollowers
    }
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
    this.stashedFollowers = properties.stashedFollowers || [];
    this.followersUnlocked = properties.followersUnlocked || false;
    this.autoDismissUnlocked = properties.autoDismissUnlocked || false;
    this.maxFollowerByType = properties.maxFollowerByType || {};
    this.stashedFollowersMaxes = properties.stashedFollowersMaxes || {};
    this.sortField = properties.sortField || "Job";
    if (properties.sortAscending === undefined) {
      this.sortAscending = true;
    } else {
      this.sortAscending = properties.sortAscending;
    }
    this.totalRecruited = properties.totalRecruited || 0;
    this.totalDied = properties.totalDied || 0;
    this.totalDismissed = properties.totalDismissed || 0;
    this.highestLevel = properties.highestLevel || 0;
    this.unlockedHiddenJobs = properties.unlockedHiddenJobs || [];
    this.autoReplaceUnlocked = properties.autoReplaceUnlocked || false;
    this.petsEnabled = properties.petsEnabled || false;
    this.onlyWantedFollowers = properties.onlyWantedFollowers || false;
    this.unhideUnlockedJobs();
    this.updateFollowerTotalPower();
  }

  unlockJob(job: string) {
    if (!this.unlockedHiddenJobs.includes(job)) {
      this.unlockedHiddenJobs.push(job);
    }
    this.unhideUnlockedJobs();
  }

  unhideUnlockedJobs() {
    for (const job of this.unlockedHiddenJobs) {
      this.jobs[job].hidden = false;
    }
  }

  generateFollower(pet = false, job?: Follower["job"]): Follower | null {
    this.totalRecruited++;
    this.followersRecruited++;
    if (this.followers.length >= this.followerCap) {
      if (this.onlyWantedFollowers){
        // check to see if we have any unwanted jobs
        const keys = Object.keys(this.jobs);
        let removedOne = false;
        for (const key of keys) {
          if (this.jobs[key].hidden) {
            continue;
          }
          const capNumber = (this.maxFollowerByType[key] !== undefined) ? this.maxFollowerByType[key] : 1000;
          let count = 0;
          for (const follower of this.followers) {
            if (follower.job === key){
              count++;
            }
            if (count > capNumber) {
              removedOne = true;
              this.dismissFollower(follower);
              break;
            }
          }
          if (removedOne){
            break;
          }
        }
        if (!removedOne){
          this.services.logService.addLogMessage("A new follower shows up, but you already have all the followers you want.", "INJURY", "FOLLOWER");
          this.followersMaxed = 'MAXED'; // Sanity check, true check below.
          return null;
        }
      } else {
        this.services.logService.addLogMessage("A new follower shows up, but you already have too many. You are forced to turn them away.", "INJURY", "FOLLOWER");
        this.followersMaxed = 'MAXED'; // Sanity check, true check below.
        return null;
      }
    }

    job = job ? job : this.generateFollowerJob(pet);
    if (job === ""){
      // couldn't find a job that we want
      return null;
    }
    const capNumber = (this.maxFollowerByType[job] !== undefined) ? this.maxFollowerByType[job] : 1000;
    if (this.numFollowersOnJob(job) >= capNumber) {
      this.services.logService.addLogMessage("A new follower shows up, but they were a " + this.camelToTitle.transform(job) + " and you don't want any more of those.", "STANDARD", "FOLLOWER");
      this.totalDismissed++;
      return null;
    }

    const lifespanDivider = this.followerLifespanDoubled ? 5 : 10;
    this.services.logService.addLogMessage("A new " + this.camelToTitle.transform(job) + " has come to learn at your feet.", "STANDARD", "FOLLOWER");
    const follower = {
      name: this.generateFollowerName(),
      age: 0,
      lifespan: Math.min(this.services.characterService.characterState.lifespan / lifespanDivider, 365000), // cap follower lifespan at 1000 years
      job: job,
      power: 1,
      cost: 100,
      pet: pet
    }
    this.followers.push(follower);
    this.sortFollowers(this.sortAscending);
    if (this.followers.length >= this.followerCap) {
      this.followersMaxed = 'MAXED';
    }
    this.updateFollowerTotalPower();
    return follower;
  }

  numFollowersOnJob(job: string): number {
    let count = 0;
    for (const follower of this.followers) {
      if (follower.job === job) {
        count++;
      }
    }
    return count;
  }

  generateFollowerName(): string {
    return FirstNames[Math.floor(Math.random() * FirstNames.length)];
  }

  generateFollowerJob(pet = false): string {
    const keys = Object.keys(this.jobs);
    const possibleJobs = [];
    for (const key of keys) {
      if (!this.jobs[key].hidden) {
        if ((pet && this.jobs[key].pet) || (!pet && !this.jobs[key].pet)) {
          if (this.onlyWantedFollowers){
            const capNumber = (this.maxFollowerByType[key] !== undefined) ? this.maxFollowerByType[key] : 1000;
            if (this.numFollowersOnJob(key) < capNumber){
              possibleJobs.push(key);
            }
          } else {
            possibleJobs.push(key);
          }
        }
      }
    }
    if (possibleJobs.length === 0){
      return "";
    }
    return possibleJobs[Math.floor(Math.random() * (possibleJobs.length))];
  }

  dismissFollower(follower: Follower) {
    this.totalDismissed++;
    const index = this.followers.indexOf(follower);
    this.followers.splice(index, 1);
    this.followersMaxed = 'UNMAXED';
    this.updateFollowerTotalPower();
  }

  
  dismissAllFollowers(follower: Follower | null = null) {
    if (follower){
      for (let index = this.followers.length - 1; index >= 0; index--) {
        if (this.followers[index].job === follower.job) {
          this.followers.splice(index, 1);
          this.totalDismissed++;
        }
      }
    } else {
      this.totalDismissed += this.followers.length;
      this.followers.splice(0);
    }
    this.followersMaxed = 'UNMAXED';
    this.updateFollowerTotalPower();
  }

  limitFollower(follower: Follower) {
    let count = 0;
    for (let index = this.followers.length - 1; index >= 0; index--) {
      if (this.followers[index].job === follower.job) {
        count++
      }
    }
    this.maxFollowerByType[follower.job] = count;
  }

  setMaxFollowers(job: string, value: number) {
    if (!value || value < 0) {
      this.maxFollowerByType[job] = 0; // In case of negatives, NaN or undefined.
    } else {
      this.maxFollowerByType[job] = value;
    }
  }

  stashFollowers() {
    this.stashedFollowers = this.followers;
    this.followers = [];
    this.stashedFollowersMaxes = this.maxFollowerByType;
    this.maxFollowerByType = {};
  }

  restoreFollowers() {
    this.followers = this.stashedFollowers;
    this.stashedFollowers = [];
    this.maxFollowerByType = this.stashedFollowersMaxes;
    this.stashedFollowersMaxes = {};
  }

  hellPurge() {
    const allowedJobs = ["prophet", "moneyBurner", "damned"];
    for (let index = this.followers.length - 1; index >= 0; index--) {
      if (!allowedJobs.includes(this.followers[index].job)) {
        this.followers.splice(index, 1);
      }
    }
  }

  unlockElementalPets() {
    this.petsEnabled = true;
    this.unlockJob("snake");
    this.unlockJob("tiger");
    this.unlockJob("ox");
    this.unlockJob("monkey");
    this.unlockJob("pig");
  }
}

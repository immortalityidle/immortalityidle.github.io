/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { Equipment, InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ReincarnationService } from './reincarnation.service';
import { BattleService } from './battle.service';
import { HellService } from './hell.service';
import { CamelToTitlePipe } from '../app.component';
import { FarmService } from './farm.service';

export type FollowerColor = 'UNMAXED' | 'MAXED';

export interface Follower {
  [key: string]: string | number | boolean | undefined;
  name: string;
  age: number;
  lifespan: number;
  job: string;
  power: number;
  cost: number;
  pet?: boolean;
}

export interface FollowersProperties {
  followersUnlocked: boolean;
  followers: Follower[];
  autoDismissUnlocked: boolean;
  maxFollowerByType: { [key: string]: number };
  maxPetsByType: { [key: string]: number };
  sortField: string;
  sortAscending: boolean;
  totalRecruited: number;
  totalDied: number;
  totalDismissed: number;
  highestLevel: number;
  stashedFollowers: Follower[];
  stashedPets: Follower[];
  stashedFollowersMaxes: { [key: string]: number };
  stashedPetMaxes: { [key: string]: number };
  unlockedHiddenJobs: string[];
  autoReplaceUnlocked: boolean;
  petsEnabled: boolean;
  onlyWantedFollowers: boolean;
  pets: Follower[];
}

export interface FollowerReserve {
  job: string;
  reserve: number;
}

type jobsType = {
  [key: string]: {
    work: (daysElapsed: number) => void;
    description: string;
    hidden?: boolean;
    pet?: boolean;
    totalPower: number;
    runEachTick?: boolean;
  };
};

@Injectable({
  providedIn: 'root',
})
export class FollowersService {
  camelToTitle = new CamelToTitlePipe();
  followersUnlocked = false;
  followerLifespanDoubled = false; // achievement
  followers: Follower[] = [];
  pets: Follower[] = [];
  stashedFollowers: Follower[] = [];
  stashedPets: Follower[] = [];
  followersRecruited = 0;
  autoDismissUnlocked = false;
  maxFollowerByType: { [key: string]: number } = {};
  maxPetsByType: { [key: string]: number } = {};
  stashedFollowersMaxes: { [key: string]: number } = {};
  stashedPetMaxes: { [key: string]: number } = {};
  followerCap = 0;
  petsCap = 0;
  followersMaxed: FollowerColor = 'UNMAXED'; // for front-end follower count number colorizing
  petsMaxed: FollowerColor = 'UNMAXED'; // for front-end follower count number colorizing
  sortField = 'Job';
  sortAscending = true;
  totalRecruited = 0;
  totalDied = 0;
  totalDismissed = 0;
  highestLevel = 0;
  hellService?: HellService;
  unlockedHiddenJobs: string[] = [];
  autoReplaceUnlocked = false;
  petsEnabled = false;
  onlyWantedFollowers = false;

  jobs: jobsType = {
    builder: {
      work: daysElapsed => {
        this.homeService.nextHomeCostReduction += this.jobs['builder'].totalPower;
        if (this.homeService.upgrading) {
          this.homeService.upgradeTick(this.jobs['builder'].totalPower * daysElapsed);
        }
      },
      description: 'Builders reduce the cost of the next home you upgrade to. They can also help you build it faster.',
      totalPower: 0,
    },
    hunter: {
      work: daysElapsed => {
        if (this.hellService?.inHell) {
          if (this.jobs['hunter'].totalPower > 1000)
            this.inventoryService.addItem(
              this.itemRepoService.items['spiritMeat'],
              Math.floor((this.jobs['hunter'].totalPower / 1000) * daysElapsed)
            );
          return;
        }
        this.inventoryService.addItem(this.itemRepoService.items['meat'], this.jobs['hunter'].totalPower * daysElapsed);
      },
      description: 'Hunters collect meat and help you hunt for hides.',
      totalPower: 0,
      runEachTick: true,
    },
    farmer: {
      work: daysElapsed => {
        this.farmService.workFields(this.jobs['farmer'].totalPower * daysElapsed);
      },
      description: 'Farmers work your fields, helping your crops to grow.',
      totalPower: 0,
      runEachTick: true,
    },
    weaponsmith: {
      work: daysElapsed => {
        let totalPower = this.jobs['weaponsmith'].totalPower;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        const rightHand = this.characterService.characterState.equipment.rightHand;
        const leftHand = this.characterService.characterState.equipment.leftHand;
        if (rightHand && rightHand.weaponStats) {
          rightHand.weaponStats.durability += Math.ceil(Math.pow(totalPower / 10, 2) * 100) * daysElapsed;
          rightHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
          rightHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
        }
        if (leftHand && leftHand.weaponStats) {
          leftHand.weaponStats.durability += Math.ceil(Math.pow(totalPower / 10, 2) * 100) * daysElapsed;
          leftHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
          leftHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
        }
      },
      description:
        'Weaponsmiths help you take care of your currently equipped weapons, adding durability to them each day. Higher levels can also help improve them.',
      totalPower: 0,
    },
    armorer: {
      work: daysElapsed => {
        let totalPower = this.jobs['armorer'].totalPower;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        const improveArmor = (armor: Equipment): Equipment => ({
          ...armor,
          armorStats: armor.armorStats
            ? {
                ...armor.armorStats,
                durability: armor.armorStats?.durability + Math.ceil(Math.pow(totalPower / 10, 2) * 50) * daysElapsed,
                defense:
                  armor.armorStats?.defense + Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2) * daysElapsed,
              }
            : undefined,
          value: armor.value + Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2) * daysElapsed,
        });
        const equipment = this.characterService.characterState.equipment; // Too many long names, reduced and referenced
        if (equipment.head && equipment.head.armorStats) {
          equipment.head = improveArmor(equipment.head);
        }
        if (equipment.body && equipment.body.armorStats) {
          equipment.body = improveArmor(equipment.body);
        }
        if (equipment.legs && equipment.legs.armorStats) {
          equipment.legs = improveArmor(equipment.legs);
        }
        if (equipment.feet && equipment.feet.armorStats) {
          equipment.feet = improveArmor(equipment.feet);
        }
      },
      description:
        'Armorers help you take care of your currently equipped pieces of armor, adding durability to them each day. Higher levels can also help improve them.',
      totalPower: 0,
    },
    brawler: {
      work: daysElapsed => {
        let totalPower = this.jobs['brawler'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('strength', totalPower);
      },
      description: 'Brawlers will spar with you in wrestling and boxing matches, increasing your strength.',
      totalPower: 0,
    },
    sprinter: {
      work: daysElapsed => {
        let totalPower = this.jobs['sprinter'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('speed', totalPower);
      },
      description: 'Sprinters challenge you to footraces and help you increase your speed.',
      totalPower: 0,
    },
    trainer: {
      work: daysElapsed => {
        let totalPower = this.jobs['trainer'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('toughness', totalPower);
      },
      description: 'Trainers make sure you follow their strict fitness and diet rules, increasing your toughness.',
      totalPower: 0,
    },
    tutor: {
      work: daysElapsed => {
        let totalPower = this.jobs['tutor'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('intelligence', totalPower);
      },
      description: 'Tutors teach you all about the wonders of the universe, increasing your intelligence.',
      totalPower: 0,
    },
    mediator: {
      work: daysElapsed => {
        let totalPower = this.jobs['mediator'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('charisma', totalPower);
      },
      description: 'Mediators teach you how to persuade others, increasing your charisma.',
      totalPower: 0,
    },
    priest: {
      work: daysElapsed => {
        let totalPower = this.jobs['priest'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.characterState.increaseAttribute('spirituality', totalPower);
      },
      description: 'Priests help you get closer to the divine, increasing your sprituality.',
      totalPower: 0,
    },
    gemologist: {
      work: daysElapsed => {
        let gemmerPower = this.jobs['gemologist'].totalPower;
        if (this.hellService?.inHell) {
          gemmerPower /= 10;
        }
        gemmerPower = Math.floor(gemmerPower / 50);
        if (gemmerPower > 4) {
          gemmerPower = 4;
        }

        // Don't run each tick and just do loop manually here since it is better for cache.
        for (let i = 0; i < daysElapsed; i++) {
          this.inventoryService.mergeAnySpiritGem(gemmerPower);
        }
      },
      description: 'Gemologists combine spirit gems into higher grades.',
      totalPower: 0,
    },
    scout: {
      work: daysElapsed => {
        // TODO: support jobs which really need to run every tick.
        let totalPower = this.jobs['scout'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.battleService.trouble();
        //this.battleService.tickCounter += totalPower;
      },
      description: 'Scouts help you track down and fight monsters faster.',
      totalPower: 0,
      runEachTick: true,
    },
    damned: {
      work: daysElapsed => {
        //this.battleService.tickCounter += this.jobs['damned'].totalPower * daysElapsed;
        this.battleService.trouble();
      },
      description:
        'Damned are souls working off karmic debt in hell that hav decided to join you. Having this follower seems to enrage the demons around you.',
      hidden: true,
      totalPower: 0,
    },
    prophet: {
      work: daysElapsed => {
        for (let i = 0; i < daysElapsed; i++) {
          if (Math.random() < this.jobs['prophet'].totalPower * 0.00001) {
            this.generateFollower();
          }
        }
      },
      description:
        'Prophets are dedicated to spreading the word of your greatness. Prophets can even find other followers for you if you are out of the mortal realm.',
      hidden: true,
      totalPower: 0,
    },
    moneyBurner: {
      work: daysElapsed => {
        let burnerPower = this.jobs['moneyBurner'].totalPower;
        burnerPower = Math.floor(burnerPower / 50);
        if (burnerPower > 10) {
          burnerPower = 10;
        } else if (burnerPower < 1) {
          burnerPower = 1;
        }
        const hellMoneyCost = 1e6 / burnerPower;
        let newHellMoney = daysElapsed;
        if (this.characterService.characterState.money < hellMoneyCost * newHellMoney) {
          newHellMoney = Math.floor(this.characterService.characterState.money / hellMoneyCost);
        }
        this.characterService.characterState.updateMoney(0 - newHellMoney * hellMoneyCost);
        this.characterService.characterState.hellMoney += newHellMoney;
      },
      description: 'Money Burners dedicate themselves to burning mortal money to produce hell money.',
      hidden: true,
      totalPower: 0,
    },
    banker: {
      work: daysElapsed => {
        let totalPower = this.jobs['banker'].totalPower;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        for (let i = 0; i < daysElapsed; i++) {
          this.characterService.characterState.updateMoney(
            this.characterService.characterState.money * 0.000000273 * totalPower
          );
          this.characterService.characterState.hellMoney +=
            this.characterService.characterState.hellMoney * 0.000000273 * totalPower;
        }
      },
      description:
        'Bankers put your money to use, earning interest on what you have. Surprisingly, this works for hell money too.',
      hidden: true,
      totalPower: 0,
    },
    snake: {
      work: daysElapsed => {
        this.characterService.characterState.increaseAttribute('fireLore', this.jobs['snake'].totalPower * daysElapsed);
      },
      description: 'A fiery serpent. Snakes understand fire and can teach you the hidden secrets of the flames.',
      hidden: true,
      pet: true,
      totalPower: 0,
    },
    tiger: {
      work: daysElapsed => {
        this.characterService.characterState.increaseAttribute('woodLore', this.jobs['tiger'].totalPower * daysElapsed);
      },
      description: 'Tigers know the secrets of the jungle and can teach you the deepest mysteries of Wood Lore.',
      hidden: true,
      pet: true,
      totalPower: 0,
    },
    ox: {
      work: daysElapsed => {
        this.characterService.characterState.increaseAttribute('earthLore', this.jobs['ox'].totalPower * daysElapsed);
      },
      description: 'Oxen connect deeply to the earth and can teach you their secret understanding.',
      hidden: true,
      pet: true,
      totalPower: 0,
    },
    monkey: {
      work: daysElapsed => {
        this.characterService.characterState.increaseAttribute(
          'metalLore',
          this.jobs['monkey'].totalPower * daysElapsed
        );
      },
      description: 'Monkeys know more about metal than the greatest of human blacksmiths.',
      hidden: true,
      pet: true,
      totalPower: 0,
    },
    pig: {
      work: daysElapsed => {
        this.characterService.characterState.increaseAttribute('waterLore', this.jobs['pig'].totalPower * daysElapsed);
      },
      description: 'Pigs understand the secrets of water and can teach them to you.',
      hidden: true,
      pet: true,
      totalPower: 0,
    },
  };

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private homeService: HomeService,
    private farmService: FarmService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private battleService: BattleService
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    mainLoopService.yearOrLongTickSubject.subscribe(daysElapsed => {
      if (!this.followersUnlocked) {
        return;
      } else if (!daysElapsed) {
        return;
      }

      this.updateFollowerCap();

      this.yearTickFollowers(this.followers, daysElapsed);
      this.yearTickFollowers(this.pets, daysElapsed);

      this.followersWorks(daysElapsed);
      this.sortFollowers(this.sortAscending, true);
      this.sortFollowers(this.sortAscending, false);
    });

    mainLoopService.tickSubject.subscribe(() => {
      if (!this.followersUnlocked) {
        return;
      }
      if (this.characterService.characterState.dead) {
        return;
      }
      if (this.characterService.characterState.age % 18250 === 0 && !this.hellService?.inHell) {
        // another 50xth birthday, you get a follower
        this.generateFollower();
      }

      // When called without days argument, we will only process followers like hunters which need to go every tick.
      this.followersWorks();

      this.followersMaxed =
        this.followers.length < this.followerCap ? (this.followersMaxed = 'UNMAXED') : (this.followersMaxed = 'MAXED');
      this.petsMaxed = this.pets.length < this.petsCap ? (this.petsMaxed = 'UNMAXED') : (this.petsMaxed = 'MAXED');
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  yearTickFollowers(listToHandle: Follower[], daysElapsed: number) {
    for (let i = listToHandle.length - 1; i >= 0; i--) {
      const follower = listToHandle[i];
      follower.age += daysElapsed;
      if (follower.age >= listToHandle[i].lifespan) {
        // follower aged off
        this.totalDied++;
        listToHandle.splice(i, 1);
        if (this.autoReplaceUnlocked) {
          const newFollower = this.generateFollower(follower.pet, follower.job);
          if (newFollower) {
            newFollower.power = Math.round(follower.power / 2);
            newFollower.cost = 100 * newFollower.power;
            this.logService.log(
              LogTopic.FOLLOWER,
              'Your follower ' +
                follower.name +
                ' passed away from old age but was replaced by their child ' +
                newFollower?.name +
                '.'
            );
          }
          this.logService.log(
            LogTopic.FOLLOWER,
            'Your follower ' +
              follower.name +
              ' passed away from old age and was not replaced because of your choices in follower jobs.'
          );
        } else {
          this.logService.injury(LogTopic.FOLLOWER, 'Your follower ' + follower.name + ' passed away from old age.');
        }
        this.updateFollowerTotalPower();
      } else if (
        this.characterService.characterState.money < listToHandle[i].cost * daysElapsed &&
        !this.hellService?.inHell
      ) {
        // quit from not being paid
        this.totalDismissed++;
        this.logService.injury(
          LogTopic.FOLLOWER,
          "You didn't have enough money to suppport your follower " +
            listToHandle[i].name +
            ' so they left your service.'
        );
        listToHandle.splice(i, 1);
        this.updateFollowerTotalPower();
      } else if (!this.hellService?.inHell) {
        this.characterService.characterState.updateMoney(0 - listToHandle[i].cost * daysElapsed);
      }
    }
  }

  updateFollowerCap() {
    this.followerCap =
      1 +
      this.homeService.homeValue * 3 +
      this.characterService.meridianRank() +
      this.characterService.soulCoreRank() +
      this.characterService.characterState.bloodlineRank;
    this.petsCap = Math.round(
      1 +
        this.characterService.meridianRank() / 10 +
        this.characterService.soulCoreRank() / 10 +
        this.characterService.characterState.bloodlineRank / 10 +
        Math.log10(this.characterService.characterState.attributes.animalHandling.value)
    );
    this.followersMaxed =
      this.followers.length < this.followerCap ? (this.followersMaxed = 'UNMAXED') : (this.followersMaxed = 'MAXED');
  }

  updateFollowerTotalPower() {
    // before calculating total set it to zero for all
    for (const job of Object.keys(this.jobs)) {
      this.jobs[job].totalPower = 0;
    }
    for (let i = this.followers.length - 1; i >= 0; i--) {
      this.jobs[this.followers[i].job].totalPower += this.followers[i].power;
    }
    for (let i = this.pets.length - 1; i >= 0; i--) {
      this.jobs[this.pets[i].job].totalPower += this.pets[i].power;
    }
  }

  sortFollowers(ascending: boolean, sortPets: boolean = false) {
    let left = 1;
    let right = -1;
    if (!ascending) {
      left = -1;
      right = 1;
    }
    let listToSort = this.followers;
    if (sortPets) {
      listToSort = this.pets;
    }
    if (this.sortField === 'Remaining Life') {
      listToSort.sort((a, b) =>
        a.lifespan - a.age > b.lifespan - b.age ? left : a.lifespan - a.age === b.lifespan - b.age ? 0 : right
      );
    } else {
      const sortField = this.sortField.toLowerCase();
      listToSort.sort((a, b) =>
        (a[sortField] ?? 0) > (b[sortField] ?? 0) ? left : a[sortField] === b[sortField] ? 0 : right
      );
    }
  }

  followersWorks(daysElapsed?: number) {
    for (const job of Object.keys(this.jobs)) {
      const jobObj = this.jobs[job];
      if (jobObj.totalPower > 0) {
        if (daysElapsed && !jobObj.runEachTick) {
          jobObj.work(daysElapsed);
        } else if (!daysElapsed && jobObj.runEachTick) {
          jobObj.work(1);
        }
      }
    }
  }

  reset() {
    if (this.characterService.characterState.bloodlineRank >= 7) {
      this.logService.log(LogTopic.FOLLOWER, 'Your imperial entourage rejoins you as you set out.');
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
      pets: this.pets,
      stashedFollowers: this.stashedFollowers,
      stashedPets: this.stashedPets,
      autoDismissUnlocked: this.autoDismissUnlocked,
      maxFollowerByType: this.maxFollowerByType,
      maxPetsByType: this.maxPetsByType,
      stashedFollowersMaxes: this.stashedFollowersMaxes,
      stashedPetMaxes: this.stashedPetMaxes,
      sortField: this.sortField,
      sortAscending: this.sortAscending,
      totalRecruited: this.totalRecruited,
      totalDied: this.totalDied,
      totalDismissed: this.totalDismissed,
      highestLevel: this.highestLevel,
      unlockedHiddenJobs: this.unlockedHiddenJobs,
      autoReplaceUnlocked: this.autoReplaceUnlocked,
      petsEnabled: this.petsEnabled,
      onlyWantedFollowers: this.onlyWantedFollowers,
    };
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
    this.pets = properties.pets || [];
    this.stashedFollowers = properties.stashedFollowers || [];
    this.stashedPets = properties.stashedPets || [];
    this.followersUnlocked = properties.followersUnlocked || false;
    this.autoDismissUnlocked = properties.autoDismissUnlocked || false;
    this.maxFollowerByType = properties.maxFollowerByType || {};
    this.maxPetsByType = properties.maxPetsByType || {};
    this.stashedFollowersMaxes = properties.stashedFollowersMaxes || {};
    this.stashedPetMaxes = properties.stashedPetMaxes || {};
    this.sortField = properties.sortField || 'Job';
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

  generateFollower(pet = false, job?: Follower['job']): Follower | null {
    let followersList = this.followers;
    let cap = this.followerCap;
    if (pet) {
      followersList = this.pets;
      cap = this.petsCap;
    }
    this.totalRecruited++;
    this.followersRecruited++;
    if (followersList.length >= cap) {
      if (this.onlyWantedFollowers) {
        // check to see if we have any unwanted jobs
        const keys = Object.keys(this.jobs);
        let removedOne = false;
        for (const key of keys) {
          if (this.jobs[key].hidden) {
            continue;
          }
          let capNumber = this.maxFollowerByType[key] !== undefined ? this.maxFollowerByType[key] : 1000;
          if (pet) {
            capNumber = this.maxPetsByType[key] !== undefined ? this.maxPetsByType[key] : 1000;
          }
          let count = 0;
          for (const follower of followersList) {
            if (follower.job === key) {
              count++;
            }
            if (count > capNumber) {
              removedOne = true;
              this.dismissFollower(follower);
              break;
            }
          }
          if (removedOne) {
            break;
          }
        }
        if (!removedOne) {
          this.logService.injury(
            LogTopic.FOLLOWER,
            'A new follower shows up, but you already have all the followers you want.'
          );
          if (pet) {
            this.petsMaxed = 'MAXED'; // Sanity check, true check below.
          } else {
            this.followersMaxed = 'MAXED'; // Sanity check, true check below.
          }
          return null;
        }
      } else {
        this.logService.injury(
          LogTopic.FOLLOWER,
          'A new follower shows up, but you already have too many. You are forced to turn them away.'
        );
        if (pet) {
          this.petsMaxed = 'MAXED'; // Sanity check, true check below.
        } else {
          this.followersMaxed = 'MAXED'; // Sanity check, true check below.
        }
        return null;
      }
    }
    job = job ? job : this.generateFollowerJob(pet, followersList);
    if (job === '') {
      // couldn't find a job that we want
      return null;
    }
    let capNumber = this.maxFollowerByType[job] !== undefined ? this.maxFollowerByType[job] : 1000;
    if (pet) {
      capNumber = this.maxPetsByType[job] !== undefined ? this.maxPetsByType[job] : 1000;
    }
    if (this.numFollowersOnJob(job, followersList) >= capNumber) {
      this.logService.log(
        LogTopic.FOLLOWER,
        'A new follower shows up, but they were a ' +
          this.camelToTitle.transform(job) +
          " and you don't want any more of those."
      );
      this.totalDismissed++;
      return null;
    }

    const lifespanDivider = this.followerLifespanDoubled ? 5 : 10;
    this.logService.log(
      LogTopic.FOLLOWER,
      'A new ' + this.camelToTitle.transform(job) + ' has come to learn at your feet.'
    );
    const follower = {
      name: this.generateFollowerName(),
      age: 0,
      lifespan: Math.min(this.characterService.characterState.lifespan / lifespanDivider, 365000), // cap follower lifespan at 1000 years
      job: job,
      power: 1,
      cost: 100,
      pet: pet,
    };
    followersList.push(follower);
    this.sortFollowers(this.sortAscending, pet);
    if (followersList.length >= cap) {
      if (pet) {
        this.petsMaxed = 'MAXED';
      } else {
        this.followersMaxed = 'MAXED';
      }
    }
    this.updateFollowerTotalPower();
    return follower;
  }

  numFollowersOnJob(job: string, followerList: Follower[]): number {
    let count = 0;
    for (const follower of followerList) {
      if (follower.job === job) {
        count++;
      }
    }
    return count;
  }

  generateFollowerName(): string {
    return FirstNames[Math.floor(Math.random() * FirstNames.length)];
  }

  generateFollowerJob(pet = false, followersList: Follower[]): string {
    const keys = Object.keys(this.jobs);
    const possibleJobs = [];
    for (const key of keys) {
      if (!this.jobs[key].hidden) {
        if ((pet && this.jobs[key].pet) || (!pet && !this.jobs[key].pet)) {
          if (this.onlyWantedFollowers) {
            let capNumber = this.maxFollowerByType[key] !== undefined ? this.maxFollowerByType[key] : 1000;
            if (pet) {
              capNumber = this.maxPetsByType[key] !== undefined ? this.maxPetsByType[key] : 1000;
            }
            if (this.numFollowersOnJob(key, followersList) < capNumber) {
              possibleJobs.push(key);
            }
          } else {
            possibleJobs.push(key);
          }
        }
      }
    }
    if (possibleJobs.length === 0) {
      return '';
    }
    return possibleJobs[Math.floor(Math.random() * possibleJobs.length)];
  }

  dismissFollower(follower: Follower) {
    this.totalDismissed++;
    if (follower.pet) {
      const index = this.pets.indexOf(follower);
      this.pets.splice(index, 1);
      this.petsMaxed = 'UNMAXED';
    } else {
      const index = this.followers.indexOf(follower);
      this.followers.splice(index, 1);
      this.followersMaxed = 'UNMAXED';
    }
    this.updateFollowerTotalPower();
  }

  dismissAllFollowers(follower: Follower | null = null, pet: boolean = false) {
    let listToDismiss = this.followers;
    if (pet) {
      listToDismiss = this.pets;
      this.petsMaxed = 'UNMAXED';
    } else {
      this.followersMaxed = 'UNMAXED';
    }
    if (follower) {
      for (let index = listToDismiss.length - 1; index >= 0; index--) {
        if (listToDismiss[index].job === follower.job) {
          listToDismiss.splice(index, 1);
          this.totalDismissed++;
        }
      }
    } else {
      this.totalDismissed += listToDismiss.length;
      listToDismiss.splice(0);
    }
    this.updateFollowerTotalPower();
  }

  limitFollower(follower: Follower) {
    let count = 0;
    let followerList = this.followers;
    if (follower.pet) {
      followerList = this.pets;
    }
    for (let index = followerList.length - 1; index >= 0; index--) {
      if (followerList[index].job === follower.job) {
        count++;
      }
    }
    if (follower.pet) {
      this.maxPetsByType[follower.job] = count;
    } else {
      this.maxFollowerByType[follower.job] = count;
    }
  }

  setMaxFollowers(job: string, value: number) {
    if (!value || value < 0) {
      this.maxFollowerByType[job] = 0; // In case of negatives, NaN or undefined.
    } else {
      this.maxFollowerByType[job] = value;
    }
  }

  setMaxPets(job: string, value: number) {
    if (!value || value < 0) {
      this.maxPetsByType[job] = 0; // In case of negatives, NaN or undefined.
    } else {
      this.maxPetsByType[job] = value;
    }
  }

  stashFollowers() {
    this.stashedFollowers = this.followers;
    this.followers = [];
    this.stashedPets = this.pets;
    this.pets = [];
    this.stashedFollowersMaxes = this.maxFollowerByType;
    this.stashedPetMaxes = this.maxPetsByType;
    this.maxFollowerByType = {};
    this.maxPetsByType = {};
  }

  restoreFollowers() {
    this.followers = this.stashedFollowers;
    this.stashedFollowers = [];
    this.pets = this.stashedPets;
    this.stashedPets = [];
    this.maxFollowerByType = this.stashedFollowersMaxes;
    this.maxPetsByType = this.stashedPetMaxes;
    this.stashedFollowersMaxes = {};
    this.stashedPetMaxes = {};
  }

  hellPurge() {
    const allowedJobs = ['prophet', 'moneyBurner', 'damned'];
    for (let index = this.followers.length - 1; index >= 0; index--) {
      if (!allowedJobs.includes(this.followers[index].job)) {
        this.followers.splice(index, 1);
      }
    }
    this.updateFollowerTotalPower();
  }

  unlockElementalPets() {
    this.petsEnabled = true;
    this.unlockJob('snake');
    this.unlockJob('tiger');
    this.unlockJob('ox');
    this.unlockJob('monkey');
    this.unlockJob('pig');
  }
}

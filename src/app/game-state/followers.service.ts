/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { Equipment, InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { BattleService } from './battle.service';
import { HellService } from './hell.service';
import { FarmService } from './farm.service';
import { CamelToTitlePipe } from '../pipes';

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
  petsBoosted: boolean;
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
  petsBoosted = false;
  onlyWantedFollowers = false;

  jobs: jobsType = {
    chef: {
      work: daysElapsed => {
        this.homeService.chefsWork(Math.floor(this.jobs['chef'].totalPower / 100) * daysElapsed);
      },
      description: 'Chefs increase the output of your kitchens.',
      totalPower: 0,
    },
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
        this.inventoryService.addItem(
          this.itemRepoService.items['meat'],
          Math.floor(this.jobs['hunter'].totalPower * daysElapsed)
        );
      },
      description: 'Hunters collect meat and help you hunt for hides.',
      totalPower: 0,
      runEachTick: true,
    },
    fisher: {
      work: daysElapsed => {
        if (this.hellService?.inHell) {
          if (this.jobs['fisher'].totalPower > 1000)
            this.inventoryService.addItem(
              this.itemRepoService.items['spiritCarp'],
              Math.floor((this.jobs['fisher'].totalPower / 1000) * daysElapsed)
            );
          return;
        }
        this.inventoryService.addItem(
          this.itemRepoService.items['carp'],
          Math.floor(this.jobs['fisher'].totalPower * daysElapsed)
        );
      },
      description: 'Fishers fish up delicious fish to contribute to your meals.',
      totalPower: 0,
      runEachTick: true,
    },
    farmer: {
      work: daysElapsed => {
        this.farmService.workFields(Math.floor(this.jobs['farmer'].totalPower * daysElapsed));
      },
      description: 'Farmers work your fields, helping your crops to grow.',
      totalPower: 0,
      runEachTick: true,
    },
    miner: {
      work: daysElapsed => {
        const power = Math.floor((this.jobs['miner'].totalPower * daysElapsed) / 100);
        this.inventoryService.addItem(this.inventoryService.getOre(), power);
      },
      description: 'Miners gather ore for your crafting.',
      totalPower: 0,
      runEachTick: true,
    },
    coalDigger: {
      work: daysElapsed => {
        const power = Math.floor((this.jobs['coalDigger'].totalPower * daysElapsed) / 100);
        this.inventoryService.addItem(this.itemRepoService.items['coal'], power);
      },
      description: 'Coal Diggers gather coal for your crafting.',
      totalPower: 0,
      runEachTick: true,
    },
    lumberjack: {
      work: daysElapsed => {
        const power = Math.floor((this.jobs['lumberjack'].totalPower * daysElapsed) / 100);
        this.inventoryService.addItem(this.inventoryService.getWood(), power);
      },
      description: 'Lumberjacks gather wood for your crafting.',
      totalPower: 0,
      runEachTick: true,
    },
    weaponsmith: {
      work: daysElapsed => {
        let totalPower = this.jobs['weaponsmith'].totalPower;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        const rightHand = this.characterService.equipment.rightHand;
        const leftHand = this.characterService.equipment.leftHand;
        if (rightHand && rightHand.weaponStats) {
          rightHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
          rightHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
        }
        if (leftHand && leftHand.weaponStats) {
          leftHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
          leftHand.value += Math.ceil(Math.pow(Math.floor(totalPower / 10), 2)) * daysElapsed;
        }
      },
      description:
        'Weaponsmiths help you take care of your currently equipped weapons, adding power to them each day. Higher levels can also help improve them.',
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
                defense:
                  armor.armorStats?.defense + Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2) * daysElapsed,
              }
            : undefined,
          value: armor.value + Math.ceil(Math.pow(Math.floor(totalPower / 10), 2) / 2) * daysElapsed,
        });
        const equipment = this.characterService.equipment; // Too many long names, reduced and referenced
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
        'Armorers help you take care of your currently equipped pieces of armor, adding defense to them each day. Higher levels can also help improve them.',
      totalPower: 0,
    },
    brawler: {
      work: daysElapsed => {
        let totalPower = this.jobs['brawler'].totalPower * daysElapsed;
        if (this.hellService?.inHell) {
          totalPower /= 10;
        }
        this.characterService.increaseAttribute('strength', totalPower);
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
        this.characterService.increaseAttribute('speed', totalPower);
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
        this.characterService.increaseAttribute('toughness', totalPower);
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
        this.characterService.increaseAttribute('intelligence', totalPower);
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
        this.characterService.increaseAttribute('charisma', totalPower);
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
        this.characterService.increaseAttribute('spirituality', totalPower);
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
      work: () => {
        this.battleService.trouble();
      },
      description: 'Scouts help you track down and fight monsters faster.',
      totalPower: 0,
      runEachTick: true,
    },
    monsterHunter: {
      work: daysElapsed => {
        const quantity = 1 + Math.floor((this.jobs['monsterHunter'].totalPower * daysElapsed) / 10);
        const grade = 1 + Math.floor(Math.log(quantity));
        this.inventoryService.addItem(this.inventoryService.generateSpiritGem(grade), quantity);
      },
      description: 'Monster Hunters take on low level monsters for you and offer you some of the gems they gather.',
      totalPower: 0,
      runEachTick: true,
    },
    damned: {
      work: () => {
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
        if (this.characterService.money < hellMoneyCost * newHellMoney) {
          newHellMoney = Math.floor(this.characterService.money / hellMoneyCost);
        }
        this.characterService.updateMoney(0 - newHellMoney * hellMoneyCost);
        this.characterService.hellMoney += newHellMoney;
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
          this.characterService.updateMoney(this.characterService.money * 0.000000273 * totalPower);
          this.characterService.hellMoney += this.characterService.hellMoney * 0.000000273 * totalPower;
        }
      },
      description:
        'Bankers put your money to use, earning interest on what you have. Surprisingly, this works for hell money too.',
      hidden: true,
      totalPower: 0,
    },
    snake: {
      work: daysElapsed => {
        let power = this.jobs['snake'].totalPower;
        if (!this.petsBoosted) {
          power *= 0.01;
        }
        this.characterService.increaseAttribute('fireLore', power * daysElapsed);
      },
      description: 'A fiery serpent. Snakes understand fire and can teach you the hidden secrets of the flames.',
      pet: true,
      totalPower: 0,
    },
    tiger: {
      work: daysElapsed => {
        let power = this.jobs['tiger'].totalPower;
        if (!this.petsBoosted) {
          power *= 0.01;
        }
        this.characterService.increaseAttribute('woodLore', power * daysElapsed);
      },
      description: 'Tigers know the secrets of the jungle and can teach you the deepest mysteries of Wood Lore.',
      pet: true,
      totalPower: 0,
    },
    ox: {
      work: daysElapsed => {
        let power = this.jobs['ox'].totalPower;
        if (!this.petsBoosted) {
          power *= 0.01;
        }
        this.characterService.increaseAttribute('earthLore', power * daysElapsed);
      },
      description: 'Oxen connect deeply to the earth and can teach you their secret understanding.',
      pet: true,
      totalPower: 0,
    },
    monkey: {
      work: daysElapsed => {
        let power = this.jobs['monkey'].totalPower;
        if (!this.petsBoosted) {
          power *= 0.01;
        }
        this.characterService.increaseAttribute('metalLore', power * daysElapsed);
      },
      description: 'Monkeys know more about metal than the greatest of human blacksmiths.',
      pet: true,
      totalPower: 0,
    },
    pig: {
      work: daysElapsed => {
        let power = this.jobs['pig'].totalPower;
        if (!this.petsBoosted) {
          power *= 0.01;
        }
        this.characterService.increaseAttribute('waterLore', power * daysElapsed);
      },
      description: 'Pigs understand the secrets of water and can teach them to you.',
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
      if (this.characterService.dead) {
        return;
      }
      if (this.characterService.age % 18250 === 0 && !this.hellService?.inHell) {
        // another 50xth birthday, you get a follower
        this.generateFollower();
      }

      // When called without days argument, we will only process followers like hunters which need to go every tick.
      this.followersWorks();

      this.followersMaxed =
        this.followers.length < this.followerCap ? (this.followersMaxed = 'UNMAXED') : (this.followersMaxed = 'MAXED');
      this.petsMaxed = this.pets.length < this.petsCap ? (this.petsMaxed = 'UNMAXED') : (this.petsMaxed = 'MAXED');
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
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
      } else if (this.characterService.money < listToHandle[i].cost * daysElapsed && !this.hellService?.inHell) {
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
        this.characterService.updateMoney(0 - listToHandle[i].cost * daysElapsed);
      }
    }
  }

  updateFollowerCap() {
    this.followerCap =
      1 +
      this.homeService.homeValue * 3 +
      this.characterService.meridianRank() +
      this.characterService.soulCoreRank() +
      this.characterService.bloodlineRank;
    this.petsCap = Math.round(
      1 +
        this.characterService.meridianRank() / 10 +
        this.characterService.soulCoreRank() / 10 +
        this.characterService.bloodlineRank / 10 +
        Math.log10(this.characterService.attributes.animalHandling.value)
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
    if (this.characterService.bloodlineRank >= 7) {
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
      petsBoosted: this.petsBoosted,
      onlyWantedFollowers: this.onlyWantedFollowers,
    };
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers;
    this.pets = properties.pets;
    this.stashedFollowers = properties.stashedFollowers;
    this.stashedPets = properties.stashedPets;
    this.followersUnlocked = properties.followersUnlocked;
    this.autoDismissUnlocked = properties.autoDismissUnlocked;
    this.maxFollowerByType = properties.maxFollowerByType;
    this.maxPetsByType = properties.maxPetsByType;
    this.stashedFollowersMaxes = properties.stashedFollowersMaxes;
    this.stashedPetMaxes = properties.stashedPetMaxes;
    this.sortField = properties.sortField;
    this.sortAscending = properties.sortAscending;
    this.totalRecruited = properties.totalRecruited;
    this.totalDied = properties.totalDied;
    this.totalDismissed = properties.totalDismissed;
    this.highestLevel = properties.highestLevel;
    this.unlockedHiddenJobs = properties.unlockedHiddenJobs;
    this.autoReplaceUnlocked = properties.autoReplaceUnlocked;
    this.petsBoosted = properties.petsBoosted;
    this.onlyWantedFollowers = properties.onlyWantedFollowers;
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
      lifespan: Math.min(this.characterService.lifespan / lifespanDivider, 365000), // cap follower lifespan at 1000 years
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
}

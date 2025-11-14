import { inject, Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { AttributeType, CharacterService, StatusType } from './character.service';
import { HomeService } from './home.service';
import { FirstNames } from './followerResources';
import { Equipment, InventoryService, ItemStack } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { BattleService } from './battle.service';
import { HellService } from './hell.service';
import { FarmService } from './farm.service';
import { CamelToTitlePipe, BigNumberPipe } from '../pipes';
import { ActivityType } from './activity';

export type FollowerColor = 'UNMAXED' | 'MAXED';

export enum HQType {
  GatheringField,
  MeetingHut,
  SimpleSchool,
  TrainingCenter,
  EliteAcademy,
  SectCompound,
  SprawlingCampus,
  FortifiedStronghold,
  MightyCitadel,
}

export interface HQ {
  name: string;
  description: string;
  moneyPerDay: number;
  gemsPerDay: number;
  foodPerDay: number;
  mealsRequired: boolean;
  maxFollowerIncrease: number;
  bonusFreeFollowers: number;
  maxLevelIncrease: number;
  experiencePerDay: number;
  upgradeMoneyCost: number;
  upgradeLandCost: number;
  upgradeTooltip: string;
  administratorsRequired: number;
  administratorLevel: number;
  inputs: number;
}

export interface Follower {
  [key: string]: string | number | boolean | WritableSignal<number> | undefined;
  name: string;
  age: number;
  lifespan: number;
  job: string;
  power: number;
  displayPower: WritableSignal<number>;
  cost: number;
  pet?: boolean;
  experience: number;
}

export interface FollowersProperties {
  followersUnlocked: boolean;
  followers: Follower[];
  autoDismissUnlocked: boolean;
  maxFollowerByType: { [key: string]: number };
  maxPetsByType: { [key: string]: number };
  savedFollowerAssignments: SavedAssignments[];
  savedPetAssignments: SavedAssignments[];
  followerTriggers: AssignmentTrigger[];
  petTriggers: AssignmentTrigger[];
  followerTriggerIndex: number;
  petTriggerIndex: number;
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
  leftoverWork: { [key: string]: number };
  followerTrainingIndex: number;
  petTrainingIndex: number;
  maxFollowerLevel: number;
  sectName: string;
  hq: HQType;
  hqInputs: ItemStack[];
  hqUnlocked: boolean;
  giftRecipientCounter: number;
}

export interface SavedAssignments {
  name: string;
  assignments: { [key: string]: number }[];
}

export interface AssignmentTrigger {
  attribute: string;
  value: number;
  savedAssignmentsName: string;
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
  bigNumberPipe = inject(BigNumberPipe);
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
  savedFollowerAssignments: SavedAssignments[] = [];
  savedPetAssignments: SavedAssignments[] = [];
  followerTriggers: AssignmentTrigger[] = [];
  petTriggers: AssignmentTrigger[] = [];
  followerTriggerIndex = 0;
  petTriggerIndex = 0;
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
  leftoverWork: { [key: string]: number } = {};
  followerTrainingIndex = 0;
  petTrainingIndex = 0;
  maxFollowerLevel = 100;
  sectName = this.generateSectName();
  hq = HQType.GatheringField;
  hqUnlocked = false;
  hqInputs: ItemStack[] = [];
  giftRecipientCounter = 0;

  hqs: HQ[] = [
    {
      name: 'Gathering Field',
      description:
        "An empty field where your followers can gather.<br>Your followers need to supply their own meals.<br>It provides no benefits, but it's free.",
      moneyPerDay: 0,
      gemsPerDay: 0,
      foodPerDay: 0,
      mealsRequired: false,
      maxFollowerIncrease: 0,
      bonusFreeFollowers: 0,
      maxLevelIncrease: 0,
      experiencePerDay: 0,
      upgradeTooltip: 'Upgrade for 100 Taels and 10 land.',
      upgradeMoneyCost: 100,
      upgradeLandCost: 10,
      administratorsRequired: 0,
      administratorLevel: 0,
      inputs: 0,
    },
    {
      name: 'Meeting Hut',
      description:
        'A small hut where your followers can rest.<br>Costs 10 Taels per day and one food item per follower.',
      moneyPerDay: 10,
      gemsPerDay: 0,
      foodPerDay: 1,
      mealsRequired: false,
      maxFollowerIncrease: 1,
      bonusFreeFollowers: 0,
      maxLevelIncrease: 1,
      experiencePerDay: 1,
      upgradeTooltip:
        'Upgrade for 10000 Taels and 100 land.<br>The next headquarters will require an administrator follower.',
      upgradeMoneyCost: 10000,
      upgradeLandCost: 100,
      administratorsRequired: 0,
      administratorLevel: 0,
      inputs: 0,
    },
    {
      name: 'Simple School',
      description:
        'A simple school where your followers can rest and train.<br>Costs 1,000 Taels, one food item per follower, and one spirit gem per day.<br>Requires an administrator follower to run it.',
      moneyPerDay: 1000,
      gemsPerDay: 1,
      foodPerDay: 1,
      mealsRequired: false,
      maxFollowerIncrease: 2,
      bonusFreeFollowers: 1,
      maxLevelIncrease: 5,
      experiencePerDay: 5,
      upgradeTooltip: 'Upgrade for 1,000,000 Taels and 1000 land.',
      upgradeMoneyCost: 1000000,
      upgradeLandCost: 1000,
      administratorsRequired: 1,
      administratorLevel: 0,
      inputs: 1,
    },
    {
      name: 'Training Center',
      description:
        'A school where your followers rest and train.<br>Costs 100,000 Taels, two food items per follower, and 10 spirit gems per day (higher quality gems can count as more than one).<br>Requires a level 10 administrator follower to run it.',
      moneyPerDay: 100000,
      gemsPerDay: 10,
      foodPerDay: 2,
      mealsRequired: false,
      maxFollowerIncrease: 10,
      bonusFreeFollowers: 1,
      maxLevelIncrease: 10,
      experiencePerDay: 10,
      upgradeTooltip:
        'Upgrade for ' +
        this.bigNumberPipe.transform(100000000) +
        ' Taels and ' +
        this.bigNumberPipe.transform(10000) +
        ' land',
      upgradeMoneyCost: 100000000,
      upgradeLandCost: 10000,
      administratorsRequired: 1,
      administratorLevel: 10,
      inputs: 1,
    },
    {
      name: 'Elite Academy',
      description:
        'An elite school where your followers rest and train.<br>Costs ' +
        this.bigNumberPipe.transform(1e10) +
        ' Taels, three food items per follower, and 40 spirit gems per day (higher quality gems can count as more than one).<br>Requires a level 20 administrator follower to run it.',
      moneyPerDay: 1e10,
      gemsPerDay: 40,
      foodPerDay: 3,
      mealsRequired: false,
      maxFollowerIncrease: 10,
      bonusFreeFollowers: 2,
      maxLevelIncrease: 20,
      experiencePerDay: 50,
      upgradeTooltip:
        'Upgrade for ' +
        this.bigNumberPipe.transform(1e12) +
        ' Taels and ' +
        this.bigNumberPipe.transform(1e6) +
        ' land',
      upgradeMoneyCost: 1e12,
      upgradeLandCost: 1e6,
      administratorsRequired: 1,
      administratorLevel: 20,
      inputs: 1,
    },
    {
      name: 'Sect Compound',
      description:
        'An elaborate compound where your followers rest and train.<br>Costs ' +
        this.bigNumberPipe.transform(1e13) +
        ' Taels, one proper meal per follower, and 100 spirit gems per day (higher quality gems can count as more than one).<br>Requires a level 50 administrator follower to run it.',
      moneyPerDay: 1e13,
      gemsPerDay: 100,
      foodPerDay: 1,
      mealsRequired: true,
      maxFollowerIncrease: 15,
      bonusFreeFollowers: 2,
      maxLevelIncrease: 30,
      experiencePerDay: 100,
      upgradeTooltip:
        'Upgrade for ' +
        this.bigNumberPipe.transform(1e15) +
        ' Taels and ' +
        this.bigNumberPipe.transform(1e7) +
        ' land',
      upgradeMoneyCost: 1e15,
      upgradeLandCost: 1e7,
      administratorsRequired: 1,
      administratorLevel: 50,
      inputs: 2,
    },
    {
      name: 'Sprawling Campus',
      description:
        'A huge campus where your followers rest and train.<br>Costs ' +
        this.bigNumberPipe.transform(1e16) +
        ' Taels, two proper meals per follower, and 200 spirit gems per day (higher quality gems can count as more than one).<br>Requires a level 100 administrator follower to run it.',
      moneyPerDay: 1e16,
      gemsPerDay: 200,
      foodPerDay: 2,
      mealsRequired: true,
      maxFollowerIncrease: 20,
      bonusFreeFollowers: 3,
      maxLevelIncrease: 50,
      experiencePerDay: 200,
      upgradeTooltip:
        'Upgrade for ' +
        this.bigNumberPipe.transform(1e18) +
        ' Taels and ' +
        this.bigNumberPipe.transform(1e8) +
        ' land',
      upgradeMoneyCost: 1e18,
      upgradeLandCost: 1e8,
      administratorsRequired: 1,
      administratorLevel: 100,
      inputs: 2,
    },
    {
      name: 'Fortified Stronghold',
      description:
        'A powerful fortress where your followers rest and train.<br>Costs ' +
        this.bigNumberPipe.transform(1e20) +
        ' Taels, three proper meals per follower, and 500 spirit gems per day (higher quality gems can count as more than one).<br>Requires 2 level 100 administrators to run it.',
      moneyPerDay: 1e20,
      gemsPerDay: 500,
      foodPerDay: 3,
      mealsRequired: true,
      maxFollowerIncrease: 30,
      bonusFreeFollowers: 4,
      maxLevelIncrease: 80,
      experiencePerDay: 300,
      upgradeTooltip:
        'Upgrade for ' +
        this.bigNumberPipe.transform(1e24) +
        ' Taels and ' +
        this.bigNumberPipe.transform(1e9) +
        ' land',
      upgradeMoneyCost: 1e24,
      upgradeLandCost: 1e9,
      administratorsRequired: 2,
      administratorLevel: 100,
      inputs: 3,
    },
    {
      name: 'Mighty Citadel',
      description:
        'An immense citidel where your followers rest and train.<br>Costs ' +
        this.bigNumberPipe.transform(1e26) +
        ' Taels, five meals per follower, and 1000 spirit gems per day (higher quality gems can count as more than one).<br>Requires 4 level 100 administrators to run it.',
      moneyPerDay: 1e26,
      gemsPerDay: 1000,
      foodPerDay: 5,
      mealsRequired: true,
      maxFollowerIncrease: 50,
      bonusFreeFollowers: 5,
      maxLevelIncrease: 100,
      experiencePerDay: 500,
      upgradeTooltip: '',
      upgradeMoneyCost: 0,
      upgradeLandCost: 0,
      administratorsRequired: 4,
      administratorLevel: 100,
      inputs: 4,
    },
  ];

  jobs: jobsType = {
    chef: {
      work: daysElapsed => {
        const workPower = this.jobs['chef'].totalPower * daysElapsed + (this.leftoverWork['chef'] || 0);
        this.homeService.chefsWork(Math.floor(workPower / 100));
        this.leftoverWork['chef'] = workPower % 100;
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
        const workPower = this.jobs['hunter'].totalPower * daysElapsed + (this.leftoverWork['hunter'] || 0);
        if (this.hellService?.inHell()) {
          this.inventoryService.addItem(this.itemRepoService.items['spiritMeat'], Math.floor(workPower / 1000));
          this.leftoverWork['hunter'] = workPower % 1000;
          return;
        }
        this.inventoryService.addItem(this.itemRepoService.items['meat'], Math.floor(workPower / 10) * daysElapsed);
        this.leftoverWork['hunter'] = workPower % 10;
      },
      description: 'Hunters collect meat and help you hunt for hides.',
      totalPower: 0,
    },
    fisher: {
      work: daysElapsed => {
        const workPower = this.jobs['fisher'].totalPower * daysElapsed + (this.leftoverWork['fisher'] || 0);
        if (this.hellService?.inHell()) {
          this.inventoryService.addItem(this.itemRepoService.items['spiritCarp'], Math.floor(workPower / 1000));
          this.leftoverWork['fisher'] = workPower % 1000;
          return;
        }
        this.inventoryService.addItem(this.itemRepoService.items['carp'], Math.floor(workPower / 10) * daysElapsed);
        this.leftoverWork['fisher'] = workPower % 10;
      },
      description: 'Fishers fish up delicious fish to contribute to your meals.',
      totalPower: 0,
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
        const workers = this.followers.filter(follower => follower.job === 'miner');
        for (const worker of workers) {
          this.inventoryService.addItem(this.inventoryService.getOre(worker.power), daysElapsed);
        }
      },
      description: 'Miners gather ore for your crafting.',
      totalPower: 0,
    },
    metallurgist: {
      work: daysElapsed => {
        const workPower = this.jobs['metallurgist'].totalPower * daysElapsed + (this.leftoverWork['metallurgist'] || 0);
        this.homeService.triggerWorkstations(ActivityType.Smelting, Math.floor(workPower / 100));
        this.leftoverWork['metallurgist'] = workPower % 100;
      },
      description: 'Metallurgists operate your smelting workstations, turning ores into refined metals.',
      totalPower: 0,
      runEachTick: true,
    },
    coalDigger: {
      work: daysElapsed => {
        const workPower = this.jobs['coalDigger'].totalPower * daysElapsed + (this.leftoverWork['coalDigger'] || 0);
        this.inventoryService.addItem(this.itemRepoService.items['coal'], Math.floor(workPower / 100));
        this.leftoverWork['coalDigger'] = workPower % 100;
      },
      description: 'Coal Diggers gather coal for your crafting.',
      totalPower: 0,
    },
    lumberjack: {
      work: daysElapsed => {
        const workers = this.followers.filter(follower => follower.job === 'lumberjack');
        for (const worker of workers) {
          this.inventoryService.addItem(this.inventoryService.getWood(worker.power), daysElapsed);
        }
      },
      description: 'Lumberjacks gather wood for your crafting.',
      totalPower: 0,
    },
    herbalist: {
      work: daysElapsed => {
        const workers = this.followers.filter(follower => follower.job === 'herbalist');
        let averagePower = 0;
        for (const worker of workers) {
          averagePower += worker.power;
        }
        averagePower = Math.floor(averagePower / workers.length);
        this.inventoryService.generateHerb(averagePower, false, daysElapsed * workers.length);
      },
      description: 'Herbalists gather herbs for your crafting.',
      totalPower: 0,
    },
    skinner: {
      work: daysElapsed => {
        const workers = this.followers.filter(follower => follower.job === 'skinner');
        for (const worker of workers) {
          this.inventoryService.addItem(this.inventoryService.getHide(worker.power), daysElapsed);
        }
      },
      description: 'Skinners gather hides for your crafting.',
      totalPower: 0,
    },
    weaponsmith: {
      work: daysElapsed => {
        const workPower = this.jobs['weaponsmith'].totalPower * daysElapsed + (this.leftoverWork['weaponsmith'] || 0);
        let divider = 10;
        if (this.hellService?.inHell()) {
          divider *= 10;
        }
        const rightHand = this.characterService.equipment.rightHand;
        const leftHand = this.characterService.equipment.leftHand;
        if (rightHand && rightHand.weaponStats) {
          rightHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(workPower / divider), 2));
          rightHand.value += Math.ceil(Math.pow(Math.floor(workPower / divider), 2)) * daysElapsed;
        }
        if (leftHand && leftHand.weaponStats) {
          leftHand.weaponStats.baseDamage += Math.ceil(Math.pow(Math.floor(workPower / divider), 2));
          leftHand.value += Math.ceil(Math.pow(Math.floor(workPower / divider), 2)) * daysElapsed;
        }
        this.leftoverWork['weaponsmith'] = workPower % divider;
      },
      description:
        'Weaponsmiths help you take care of your currently equipped weapons, adding power to them each day. Higher levels can also help improve them.',
      totalPower: 0,
    },
    armorer: {
      work: daysElapsed => {
        const workPower = this.jobs['armorer'].totalPower * daysElapsed + (this.leftoverWork['armorer'] || 0);
        let divider = 10;
        if (this.hellService?.inHell()) {
          divider *= 10;
        }
        const improveArmor = (armor: Equipment): Equipment => ({
          ...armor,
          armorStats: armor.armorStats
            ? {
                ...armor.armorStats,
                defense: armor.armorStats?.defense + Math.ceil(Math.pow(Math.floor(workPower / divider), 2) / 2),
              }
            : undefined,
          value: armor.value + Math.ceil(Math.pow(Math.floor(workPower / divider), 2) / 2),
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
        this.leftoverWork['armorer'] = workPower % divider;
      },
      description:
        'Armorers help you take care of your currently equipped pieces of armor, adding defense to them each day. Higher levels can also help improve them.',
      totalPower: 0,
    },
    brawler: {
      work: daysElapsed => {
        let totalPower = this.jobs['brawler'].totalPower * daysElapsed;
        if (this.hellService?.inHell()) {
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
        if (this.hellService?.inHell()) {
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
        if (this.hellService?.inHell()) {
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
        if (this.hellService?.inHell()) {
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
        if (this.hellService?.inHell()) {
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
        if (this.hellService?.inHell()) {
          totalPower /= 10;
        }
        this.characterService.increaseAttribute('spirituality', totalPower);
      },
      description: 'Priests help you get closer to the divine, increasing your sprituality.',
      totalPower: 0,
    },
    gemologist: {
      work: daysElapsed => {
        const workPower = this.jobs['gemologist'].totalPower * daysElapsed + (this.leftoverWork['gemologist'] || 0);
        let divisor = 50;
        if (this.hellService?.inHell()) {
          divisor *= 10;
        }
        this.leftoverWork['gemologist'] = workPower % divisor;
        const gemmerPower = Math.floor(workPower / divisor);
        if (gemmerPower === 0) {
          return;
        }
        this.inventoryService.mergeAnySpiritGem(gemmerPower);
      },
      description: 'Gemologists combine spirit gems into higher grades.',
      totalPower: 0,
    },
    scout: {
      work: () => {
        this.battleService.yearlyMonsterDay += this.jobs['scout'].totalPower;
      },
      description: 'Scouts help you track down and get in fights with monsters faster.',
      totalPower: 0,
      runEachTick: true,
    },
    monsterHunter: {
      work: daysElapsed => {
        const workers = this.followers.filter(follower => follower.job === 'monsterHunter');
        for (const worker of workers) {
          this.inventoryService.addItem(
            this.inventoryService.generateSpiritGem(Math.ceil(worker.power / 8)),
            daysElapsed
          );
        }
      },
      description: 'Monster Hunters take on low level monsters for you and offer you some of the gems they gather.',
      totalPower: 0,
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
        let workPower = this.jobs['prophet'].totalPower * daysElapsed + (this.leftoverWork['prophet'] || 0);
        while (workPower > 100000) {
          this.generateFollower();
          workPower -= 100000;
        }
        this.leftoverWork['prophet'] = workPower;
      },
      description:
        'Prophets are dedicated to spreading the word of your greatness. Prophets can even find other followers for you if you are out of the mortal realm.',
      hidden: true,
      totalPower: 0,
    },
    moneyBurner: {
      work: daysElapsed => {
        const workPower = this.jobs['moneyBurner'].totalPower * daysElapsed + (this.leftoverWork['moneyBurner'] || 0);
        const burnerPower = Math.floor(workPower / 50);
        this.leftoverWork['moneyBurner'] = workPower % 50;
        if (burnerPower === 0) {
          return;
        }
        const cost = 1e6 * burnerPower;
        if (this.characterService.money < cost) {
          return;
        }
        this.characterService.updateMoney(0 - cost);
        this.characterService.hellMoney += burnerPower;
      },
      description: 'Money Burners dedicate themselves to burning mortal money to produce hell money.',
      hidden: true,
      totalPower: 0,
    },
    banker: {
      work: daysElapsed => {
        let totalPower = this.jobs['banker'].totalPower;
        if (this.hellService?.inHell()) {
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
    administrator: {
      work: () => {
        /* do nothing, just like in real life */
      },
      description: 'Administrators are required to operate complex organizations to their fullest.',
      hidden: false,
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

      this.checkTriggers();
    });

    mainLoopService.tickSubject.subscribe(() => {
      if (!this.followersUnlocked) {
        return;
      }
      if (this.characterService.dead) {
        return;
      }
      if (this.characterService.age % 18250 === 0 && !this.hellService?.inHell()) {
        // another 50xth birthday, you get bonus followers
        for (let i = 0; i < 1 + this.hqs[this.hq].bonusFreeFollowers; i++) {
          this.generateFollower();
        }
      }

      this.followersWorks();
      this.hqWorks();

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
      } else if (this.characterService.money < listToHandle[i].cost * daysElapsed && !this.hellService?.inHell()) {
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
      } else if (!this.hellService?.inHell()) {
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
    if (this.hqUnlocked) {
      this.followerCap += this.hqs[this.hq].maxFollowerIncrease;
    }

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

  hqWorks() {
    // check if requirements are met
    if (!this.hqUnlocked) {
      return;
    }
    if (this.characterService.money < this.hqs[this.hq].moneyPerDay) {
      return;
    }
    let foodSubType = '';
    if (this.hqs[this.hq].mealsRequired) {
      foodSubType = 'meal';
    }
    if (
      this.hqs[this.hq].foodPerDay > 0 &&
      this.inventoryService.checkFor('food', this.hqs[this.hq].foodPerDay * this.followers.length, foodSubType) === -1
    ) {
      return;
    }
    if (
      this.hqs[this.hq].gemsPerDay > 0 &&
      this.inventoryService.checkForByValue('gem', this.hqs[this.hq].gemsPerDay * 10) === -1
    ) {
      return;
    }
    const administrators = this.followers.filter(follower => follower.job === 'administrator');
    let adminsAtLevel = 0;
    for (const admin of administrators) {
      if (admin.power >= this.hqs[this.hq].administratorLevel) {
        adminsAtLevel++;
      }
    }
    if (adminsAtLevel < this.hqs[this.hq].administratorsRequired) {
      return;
    }

    // requirements are met, pay costs
    this.characterService.updateMoney(0 - this.hqs[this.hq].moneyPerDay);
    if (this.hqs[this.hq].gemsPerDay > 0) {
      this.inventoryService.consumeByValue('gem', this.hqs[this.hq].gemsPerDay * 10);
    }
    if (this.hqs[this.hq].foodPerDay > 0) {
      this.inventoryService.consume('food', this.hqs[this.hq].foodPerDay, true, false, foodSubType);
    }

    // get the benefits
    for (const follower of this.followers) {
      follower.experience += this.hqs[this.hq].experiencePerDay;
      this.levelUp(follower);
    }
    this.giftRecipientCounter++;
    if (this.giftRecipientCounter >= this.followers.length) {
      this.giftRecipientCounter = 0;
    }
    for (const input of this.hqInputs) {
      if (input.item && input.quantity > 0) {
        if (input.item.type === 'pill') {
          if (input.item.effect === 'longevity') {
            this.followers[this.giftRecipientCounter].lifespan += input.item.increaseAmount || 1;
          } else {
            this.followers[this.giftRecipientCounter].experience += input.item.increaseAmount || 1;
          }
          input.quantity--;
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

    this.followerTriggerIndex = 0;
    if (this.followerTriggers.length > 0) {
      // trigger entry 0 is special, it always loads on rebirth regardless of attribute values
      this.loadSavedAssignments(this.followerTriggers[0].savedAssignmentsName, false);
      this.followerTriggerIndex++;
    }
    this.petTriggerIndex = 0;
    if (this.petTriggers.length > 0) {
      // trigger entry 0 is special, it always loads on rebirth regardless of attribute values
      this.loadSavedAssignments(this.petTriggers[0].savedAssignmentsName, true);
      this.petTriggerIndex++;
    }
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
      savedFollowerAssignments: this.savedFollowerAssignments,
      savedPetAssignments: this.savedPetAssignments,
      followerTriggers: this.followerTriggers,
      petTriggers: this.petTriggers,
      followerTriggerIndex: this.followerTriggerIndex,
      petTriggerIndex: this.petTriggerIndex,
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
      leftoverWork: this.leftoverWork,
      followerTrainingIndex: this.followerTrainingIndex,
      petTrainingIndex: this.petTrainingIndex,
      maxFollowerLevel: this.maxFollowerLevel,
      sectName: this.sectName,
      hq: this.hq,
      hqInputs: this.hqInputs,
      hqUnlocked: this.hqUnlocked,
      giftRecipientCounter: this.giftRecipientCounter,
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
    this.savedFollowerAssignments = properties.savedFollowerAssignments;
    this.savedPetAssignments = properties.savedPetAssignments;
    this.followerTriggers = properties.followerTriggers;
    this.petTriggers = properties.petTriggers;
    this.followerTriggerIndex = properties.followerTriggerIndex;
    this.petTriggerIndex = properties.petTriggerIndex;
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
    this.leftoverWork = properties.leftoverWork;
    this.followerTrainingIndex = properties.followerTrainingIndex;
    this.petTrainingIndex = properties.petTrainingIndex;
    this.maxFollowerLevel = properties.maxFollowerLevel;
    this.sectName = properties.sectName;
    this.hq = properties.hq;
    this.hqUnlocked = properties.hqUnlocked;
    this.hqInputs = properties.hqInputs;
    this.giftRecipientCounter = properties.giftRecipientCounter;
    this.unhideUnlockedJobs();
    this.updateFollowerTotalPower();
    this.updateHQInputs();
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
    // cap follower lifespan at 1000 years, minimum 18 years of service
    const lifespan = Math.min(Math.max(this.characterService.lifespan / lifespanDivider, 18 * 365), 365000);
    const follower = {
      name: this.generateFollowerName(),
      age: 0,
      lifespan: lifespan,
      job: job,
      power: 1,
      displayPower: signal<number>(1),
      cost: 100,
      pet: pet,
      experience: 0,
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
    this.logService.log(
      LogTopic.FOLLOWER,
      follower.name +
        ' (level ' +
        follower.power +
        ' ' +
        this.camelToTitle.transform(follower.job) +
        ') has left your service.'
    );
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

  saveAssignments(saveName: string, pets: boolean) {
    let savedAssignments;
    let currentAssignments;
    if (pets) {
      savedAssignments = this.savedPetAssignments;
      currentAssignments = this.maxPetsByType;
    } else {
      savedAssignments = this.savedFollowerAssignments;
      currentAssignments = this.maxFollowerByType;
    }

    const assignmentSet = savedAssignments.find(entry => entry.name === saveName);

    if (assignmentSet) {
      assignmentSet.assignments = JSON.parse(JSON.stringify(currentAssignments));
    } else {
      savedAssignments.push({
        name: saveName,
        assignments: JSON.parse(JSON.stringify(currentAssignments)),
      });
    }
  }

  loadSavedAssignments(saveName: string, pets: boolean) {
    if (pets) {
      const assignmentSet = this.savedPetAssignments.find(entry => entry.name === saveName);
      if (assignmentSet) {
        this.maxPetsByType = JSON.parse(JSON.stringify(assignmentSet.assignments));
      }
    } else {
      const assignmentSet = this.savedFollowerAssignments.find(entry => entry.name === saveName);
      if (assignmentSet) {
        this.maxFollowerByType = JSON.parse(JSON.stringify(assignmentSet.assignments));
      }
    }
  }

  removeSavedAssignments(saveName: string, pets: boolean) {
    if (pets) {
      const assignmentSetIndex = this.savedPetAssignments.findIndex(entry => entry.name === saveName);
      if (assignmentSetIndex >= 0) {
        this.savedPetAssignments.splice(assignmentSetIndex, 1);
      }
      // also clear any triggers that used that schedule
      for (let i = this.followerTriggers.length - 1; i >= 0; i--) {
        if (this.followerTriggers[i].savedAssignmentsName === saveName) {
          this.followerTriggers.splice(i, 1);
        }
      }
    } else {
      const assignmentSetIndex = this.savedFollowerAssignments.findIndex(entry => entry.name === saveName);
      if (assignmentSetIndex >= 0) {
        this.savedFollowerAssignments.splice(assignmentSetIndex, 1);
      }
      // also clear any triggers that used that schedule
      for (let i = this.petTriggers.length - 1; i >= 0; i--) {
        if (this.petTriggers[i].savedAssignmentsName === saveName) {
          this.petTriggers.splice(i, 1);
        }
      }
    }
  }

  checkTriggers() {
    if (this.followerTriggerIndex < this.followerTriggers.length) {
      const trigger = this.followerTriggers[this.followerTriggerIndex];
      if (trigger.attribute === 'money') {
        if (this.characterService.money >= trigger.value) {
          this.followerTriggerIndex++;
          this.loadSavedAssignments(trigger.savedAssignmentsName, false);
        }
        return;
      }
      const attribute = trigger.attribute as AttributeType;
      if (this.characterService.attributes[attribute]) {
        if (this.characterService.attributes[attribute].value >= trigger.value) {
          this.followerTriggerIndex++;
          this.loadSavedAssignments(trigger.savedAssignmentsName, false);
        }
        return;
      }
      const status = trigger.attribute as StatusType;
      if (this.characterService.status[status].max >= trigger.value) {
        this.followerTriggerIndex++;
        this.loadSavedAssignments(trigger.savedAssignmentsName, false);
      }
    }

    if (this.petTriggerIndex < this.petTriggers.length) {
      const trigger = this.petTriggers[this.petTriggerIndex];
      if (trigger.attribute === 'money') {
        if (this.characterService.money >= trigger.value) {
          this.petTriggerIndex++;
          this.loadSavedAssignments(trigger.savedAssignmentsName, true);
        }
        return;
      }
      const attribute = trigger.attribute as AttributeType;
      if (this.characterService.attributes[attribute]) {
        if (this.characterService.attributes[attribute].value >= trigger.value) {
          this.petTriggerIndex++;
          this.loadSavedAssignments(trigger.savedAssignmentsName, true);
        }
        return;
      }
      const status = trigger.attribute as StatusType;
      if (this.characterService.status[status].max >= trigger.value) {
        this.petTriggerIndex++;
        this.loadSavedAssignments(trigger.savedAssignmentsName, true);
      }
    }
  }

  trainFollower(experience: number, pet: boolean) {
    let followerList = this.followers;
    let followerLabel = 'followers';
    let index = this.followerTrainingIndex;
    if (pet) {
      followerList = this.pets;
      followerLabel = 'pets';
      index = this.petTrainingIndex;
    }

    if (followerList.length === 0) {
      this.logService.log(LogTopic.FOLLOWER, 'You fail to train any ' + followerLabel + " because you don't have any.");
      return;
    }

    if (index >= followerList.length) {
      index = 0;
    }
    const startingIndex = index;
    while (followerList[index].power >= this.maxFollowerLevel) {
      index++;
      if (index >= followerList.length) {
        index = 0;
      }
      if (index === startingIndex) {
        this.logService.log(LogTopic.FOLLOWER, 'All of your ' + followerLabel + ' are fully trained.');
        return;
      }
    }
    const follower = followerList[index];
    follower.experience = Math.floor((follower.experience || 0) + experience);
    this.levelUp(follower);
    if (pet) {
      this.petTrainingIndex = ++index;
    } else {
      this.followerTrainingIndex = ++index;
    }
  }

  levelUp(follower: Follower) {
    while (follower.experience > follower.power * 1000 && follower.power < this.maxFollowerLevel) {
      follower.experience -= follower.power * 1000;
      follower.power++;
      if (follower.power > this.highestLevel) {
        this.highestLevel = follower.power;
      }
      this.logService.log(
        LogTopic.FOLLOWER,
        follower.name + ' gains additional power as a ' + this.camelToTitle.transform(follower.job)
      );
      this.updateFollowerTotalPower();
    }
  }

  generateSectName(): string {
    const adjectives = [
      'Verdant',
      'Green',
      'Azure',
      'Peaceful',
      'Vermillion',
      'Bold',
      'Purple',
      'Delicate',
      'Scarlet',
      'Screaming',
      'Cultivating',
      'Immortal',
      'Spirit',
      'Clear',
      'Unbound',
      'Boundless',
      'Moon',
      'Sunbright',
      'Midnight',
      'Floating',
      'Golden',
      'Silver',
      'Shining',
      'Dancing',
      'Glowing',
      'Sleeping',
      'Divided',
      'Ethereal',
      'Foolish',
      'Flowing',
    ];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const nouns = [
      'Waters',
      'Lotus',
      'Orchid',
      'Mountain',
      'Butterfly',
      'Mantis',
      'Demon',
      'Blade',
      'Starlight',
      'Ruins',
      'Cloud',
      'Incense',
      'Islands',
      'Storm',
      'Dream',
      'River',
      'Wisdom',
      'Heart',
      'Sun',
      'Mist',
      'Raven',
      'Eagle',
      'Hawk',
      'Koi',
      'Tiger',
      'Phoenix',
      'Mandate',
      'Commandment',
      'Shield',
    ];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const organizations = [
      'Sect',
      'Court',
      'Temple',
      'Society',
      'Syndicate',
      'Crew',
      'Church',
      'Club',
      'Fellowship',
      'Faction',
      'Movement',
      'Order',
    ];
    const organization = organizations[Math.floor(Math.random() * organizations.length)];
    if (Math.random() > 0.5) {
      return adjective + ' ' + noun + ' ' + organization;
    } else {
      return organization + ' of the ' + adjective + ' ' + noun;
    }
  }

  renameSect() {
    this.sectName = this.generateSectName();
  }

  upgradeHQ() {
    if (this.characterService.money < this.hqs[this.hq].upgradeMoneyCost) {
      this.logService.log(LogTopic.EVENT, "You don't have enough money to upgrade your headquarters.");
      return;
    }
    if (this.homeService.land < this.hqs[this.hq].upgradeLandCost) {
      this.logService.log(LogTopic.EVENT, "You don't have enough land to upgrade your headquarters.");
      return;
    }
    this.characterService.money -= this.hqs[this.hq].upgradeMoneyCost;
    this.homeService.land -= this.hqs[this.hq].upgradeLandCost;
    this.hq++;
    this.maxFollowerLevel = 100 + this.hqs[this.hq].maxLevelIncrease;
    this.updateFollowerCap();
    this.updateHQInputs();
  }

  downgradeHQ() {
    this.hq--;
    this.homeService.land += this.hqs[this.hq].upgradeLandCost;
    this.maxFollowerLevel = 100 + this.hqs[this.hq].maxLevelIncrease;
    this.updateFollowerCap();
    this.updateHQInputs();
  }

  updateHQInputs() {
    const inputStacks = this.hqInputs;
    while (inputStacks.length < this.hqs[this.hq].inputs) {
      inputStacks.push(this.inventoryService.getEmptyItemStack());
    }

    while (inputStacks.length > this.hqs[this.hq].inputs) {
      const lastInputStack = inputStacks[inputStacks.length - 1];
      if (lastInputStack.item) {
        this.inventoryService.addItem(lastInputStack.item, lastInputStack.quantity);
      }
      inputStacks.splice(inputStacks.length - 1);
    }
  }

  dismissYoungestFollower() {
    if (this.followers.length === 0) {
      return;
    }
    let youngestFollower = this.followers[0];
    for (let i = 0; i < this.followers.length; i++) {
      if (this.followers[i].age < youngestFollower.age) {
        youngestFollower = this.followers[i];
      }
    }
    this.dismissFollower(youngestFollower);
  }

  moveItemToInput(itemIndex: number, destinationInputIndex: number) {
    if (!this.inventoryService.itemStacks[itemIndex].item) {
      // no item to move, bail out
      return;
    }
    if (this.hqInputs[destinationInputIndex].item) {
      if (this.hqInputs[destinationInputIndex].item?.name === this.inventoryService.itemStacks[itemIndex].item?.name) {
        // same item type, dump the quantity into the workstation
        const maxAdditionalQuantity =
          this.inventoryService.maxStackSize - this.hqInputs[destinationInputIndex].quantity;
        if (this.inventoryService.itemStacks[itemIndex].quantity < maxAdditionalQuantity) {
          this.hqInputs[destinationInputIndex].quantity += this.inventoryService.itemStacks[itemIndex].quantity;
          this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
        } else {
          this.hqInputs[destinationInputIndex].quantity += maxAdditionalQuantity;
          this.inventoryService.itemStacks[itemIndex].quantity -= maxAdditionalQuantity;
        }
        return;
      }
      if (this.hqInputs[destinationInputIndex].quantity === 0) {
        this.hqInputs[destinationInputIndex] = this.inventoryService.itemStacks[itemIndex];
        this.hqInputs[destinationInputIndex].id =
          destinationInputIndex +
          this.hqInputs[destinationInputIndex].item!.name +
          this.hqInputs[destinationInputIndex].quantity;
        this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
      } else {
        // swap the workstation item with the inventory item
        const temp = this.inventoryService.itemStacks[itemIndex];
        this.inventoryService.itemStacks[itemIndex] = this.hqInputs[destinationInputIndex];
        this.hqInputs[destinationInputIndex] = temp;
        this.hqInputs[destinationInputIndex].id =
          destinationInputIndex +
          this.hqInputs[destinationInputIndex].item!.name +
          this.hqInputs[destinationInputIndex].quantity;
        this.inventoryService.fixId(itemIndex);
      }
    } else {
      // nothing there now, just put the inventory item in the workstation
      this.hqInputs[destinationInputIndex] = this.inventoryService.itemStacks[itemIndex];
      this.hqInputs[destinationInputIndex].id =
        destinationInputIndex +
        this.hqInputs[destinationInputIndex].item!.name +
        this.hqInputs[destinationInputIndex].quantity;
      this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
    }
  }
}

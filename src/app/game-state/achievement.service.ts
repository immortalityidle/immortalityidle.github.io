import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from './character.service';
import { InventoryService } from './inventory.service';
import { HomeService, HomeType } from './home.service';
import { ItemRepoService } from './item-repo.service';
import { StoreService } from './store.service';
import { MainLoopService } from './main-loop.service';
import { BattleService } from './battle.service';
import { GameStateService } from './game-state.service';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity';
import { ImpossibleTaskService } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { HellService } from './hell.service';
import { FarmService } from './farm.service';

export interface Achievement {
  name: string;
  /**Necessary for name changes due to save structure using name (above) instead of ids */
  displayName?: string;
  description: string;
  hint: string;
  check: () => boolean;
  effect: () => void;
  unlocked: boolean;
}

export interface AchievementProperties {
  unlockedAchievements: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  gameStateService?: GameStateService;
  unlockedAchievements: string[] = [];

  constructor(
    private mainLoopService: MainLoopService,
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    private storeService: StoreService,
    private battleService: BattleService,
    private homeService: HomeService,
    private farmService: FarmService,
    private activityService: ActivityService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService,
    private hellService: HellService
  ) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      for (const achievement of this.achievements) {
        if (!this.unlockedAchievements.includes(achievement.name)) {
          if (achievement.check()) {
            this.unlockAchievement(achievement, true);
          }
        }
      }
    });
  }

  // important: achievement effects must be idempotent as they may be called multiple times
  achievements: Achievement[] = [
    {
      name: 'One Week',
      description: 'You survived your first week of this game!',
      hint: 'Try some activities.',
      check: () => {
        return this.mainLoopService.totalTicks > 7;
      },
      effect: () => {
        this.mainLoopService.timeUnlocked = true;
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService.unlockPanel('timePanel');
        this.gameStateService.addLayoutPanel('timePanel');
      },
      unlocked: false,
    },
    {
      name: 'Big Earner',
      description:
        'You earned your first few taels by working hard.<br>Maybe you should invest in some land and a better home.',
      hint: 'Make some money.',
      check: () => {
        return this.characterService.characterState.money >= 100;
      },
      effect: () => {
        this.homeService.homeUnlocked = true;
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService?.unlockPanel('homePanel');
        this.gameStateService.addLayoutPanel('homePanel', 68, 15, 30, 20);
      },
      unlocked: false,
    },
    {
      name: 'Bookworm',
      description:
        'You opened the manuals shop and unlocked the ' + this.itemRepoService.items['restartActivityManual'].name,
      hint: 'There are lots of buttons in this game, maybe an aspiring immortal should press a few.',
      check: () => {
        return this.storeService.storeOpened;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['restartActivityManual']);
      },
      unlocked: false,
    },
    {
      name: 'Played a Bit',
      description:
        'You worked toward immortality for ten years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 3650;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Basically an Expert',
      description:
        'You worked toward immortality for one hundred years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fasterPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fasterPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Farmer',
      description: 'You plowed your first field!',
      hint: 'Cultivation might be important for cultivation.',
      check: () => {
        return this.farmService.fallowPlots > 0;
      },
      effect: () => {
        this.gameStateService?.unlockPanel('farmPanel');
      },
      unlocked: false,
    },
    {
      name: 'Gear Up!',
      description: 'You created some equipment and now you can wear it.',
      hint: 'Some jobs let you make stuff you can use.',
      check: () => {
        return (
          this.inventoryService.equipmentCreated > 0 ||
          this.characterService.characterState.equipment.head !== null ||
          this.characterService.characterState.equipment.body !== null ||
          this.characterService.characterState.equipment.leftHand !== null ||
          this.characterService.characterState.equipment.rightHand !== null ||
          this.characterService.characterState.equipment.legs !== null ||
          this.characterService.characterState.equipment.feet !== null
        );
      },
      effect: () => {
        this.inventoryService.equipmentUnlocked = true;
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService?.unlockPanel('equipmentPanel');
      },
      unlocked: false,
    },
    {
      name: 'Stuff!',
      description: 'You got your first item.',
      hint: 'Find anything.',
      check: () => {
        return this.inventoryService.totalItemsReceived > 0;
      },
      effect: () => {
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService?.unlockPanel('inventoryPanel');
      },
      unlocked: false,
    },
    {
      name: 'Attack!',
      description: 'You are under attack by an enemy.',
      hint: 'They are coming for you.',
      check: () => {
        return this.battleService.totalEnemies > 0;
      },
      effect: () => {
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService?.unlockPanel('battlePanel');
        this.gameStateService.addLayoutPanel('battlePanel', 68, 35, 30, 20);
      },
      unlocked: false,
    },
    {
      name: 'Persistent Reincarnator',
      description:
        'You lived one thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastestPlayManual'].name,
      hint: 'The millennial.',
      check: () => {
        return this.mainLoopService.totalTicks > 365000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastestPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Cabbage Stand',
      description: 'You can now grow cabbage in your farm. Watch out for kids running by when you sell them.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 2;
      },
      effect: () => {
        this.farmService.unlockCrop('cabbage');
      },
      unlocked: false,
    },
    {
      name: 'The Magical Fruit',
      description: 'You can now grow beans in your farm.',
      hint: "They're not really a fruit.",
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 5;
      },
      effect: () => {
        this.farmService.unlockCrop('beans');
      },
      unlocked: false,
    },
    {
      name: 'Little Green Trees',
      description: 'You can now grow broccoli in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 10;
      },
      effect: () => {
        this.farmService.unlockCrop('broccoli');
      },
      unlocked: false,
    },
    {
      name: 'A Gourd You Might Not Know',
      description: 'You can now grow calabash in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 50;
      },
      effect: () => {
        this.farmService.unlockCrop('calabash');
      },
      unlocked: false,
    },
    {
      name: "It's Not Just for Boba",
      description: 'You can now grow taro in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 100;
      },
      effect: () => {
        this.farmService.unlockCrop('taro');
      },
      unlocked: false,
    },
    {
      name: 'First Fruits',
      description: 'You can now grow pears in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1000;
      },
      effect: () => {
        this.farmService.unlockCrop('pear');
      },
      unlocked: false,
    },
    {
      name: 'They Come in Different Sizes',
      description: 'You can now grow melons in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 10000;
      },
      effect: () => {
        this.farmService.unlockCrop('melon');
      },
      unlocked: false,
    },
    {
      name: 'Purple Sweet and Sour',
      description: 'You can now grow plums in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1e6;
      },
      effect: () => {
        this.farmService.unlockCrop('plum');
      },
      unlocked: false,
    },
    {
      name: 'A Tiny Taste of Immortality',
      description: 'You can now grow apricot in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1e9;
      },
      effect: () => {
        this.farmService.unlockCrop('apricot');
      },
      unlocked: false,
    },
    {
      name: 'Almost Eating Like an Immortal',
      description: 'You can now grow peaches in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1e12;
      },
      effect: () => {
        this.farmService.unlockCrop('peach');
      },
      unlocked: false,
    },
    {
      name: '',
      description: 'You can now grow Divine Peaches in your farm.',
      hint: 'Descend to the depths and bring back the sweetest fruit.',
      check: () => {
        return this.inventoryService.divinePeachesUnlocked;
      },
      effect: () => {
        this.farmService.unlockCrop('divinePeach');
      },
      unlocked: false,
    },
    {
      name: 'Veteran Cultivator',
      description:
        'You lived ten thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['totalPlaytimeManual'].name,
      hint: 'A long life. Myriad years.',
      check: () => {
        return this.mainLoopService.totalTicks > 3650000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['totalPlaytimeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Clang! Clang! Clang!',
      description:
        'You reached proficiency in blacksmithing and can now work as a Blacksmith without going through an apprenticeship (you still need the attributes for the Blacksmithing activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Bubble, Bubble',
      description:
        'You reached proficiency in alchemy and can now work as a Alchemist without going through an apprenticeship (you still need the attributes for the Alchemy activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Alchemy);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Tanner',
      description:
        'You reached proficiency in leatherworking and can now work as a Leatherworker without going through an apprenticeship (you still need the attributes for the Leatherworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Carpenter',
      description:
        'You reached proficiency in woodworking and can now work as a Woodworker without going through an apprenticeship (you still need the attributes for the Woodworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Woodworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Addict',
      description: 'You got a taste of those sweet, sweet empowerment pills and want more.',
      hint: 'Master of all.',
      check: () => {
        return this.characterService.characterState.empowermentFactor > 1;
      },
      effect: () => {
        //TODO: Create a downside to taking empowerment pills, maybe post-Death
      },
      unlocked: false,
    },
    {
      name: 'Habitual User',
      displayName: 'Dope',
      description:
        "You got every last drop you could out of those pills and now you feel nothing from them.<br>At least they didn't kill you or do lasting harm, right?",
      hint: 'D.A.R.E.',
      check: () => {
        return this.characterService.characterState.empowermentFactor >= 1953.65;
      },
      effect: () => {
        //TODO: Create a downside to taking HUGE NUMBERS of empowerment pills, maybe in Hell?
      },
      unlocked: false,
    },
    {
      name: 'This Sparks Joy',
      description: 'You used 888 items and unlocked the ' + this.itemRepoService.items['autoUseManual'].name,
      hint: 'Immortals should know the potential of the things they use.',
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoUseManual']);
      },
      unlocked: false,
    },
    {
      name: 'This Does Not Spark Joy',
      description:
        'You filled your entire inventory and unlocked the ' + this.itemRepoService.items['autoSellManual'].name,
      hint: 'So much stuff.',
      check: () => {
        return this.inventoryService.openInventorySlots() === 0;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoSellManual']);
      },
      unlocked: false,
    },
    {
      name: 'Waster',
      description:
        'You throw away 10,000 items and unlocked the ' + this.itemRepoService.items['betterStorageManual'].name,
      hint: 'Too much stuff.',
      check: () => {
        return this.inventoryService.thrownAwayItems >= 10000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['betterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Landfill',
      description:
        'You throw away 100,000 items and unlocked the ' + this.itemRepoService.items['evenBetterStorageManual'].name,
      hint: 'Way, way too much stuff.',
      check: () => {
        return this.inventoryService.maxStackSize >= 1000 && this.inventoryService.thrownAwayItems >= 100000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['evenBetterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hoarder',
      description:
        'You really love holding vast amounts of materials and unlocked the ' +
        this.itemRepoService.items['bestStorageManual'].name,
      hint: "Just stop already, it's too much.<br>Why would an aspiring immortal need this much stuff?",
      check: () => {
        return this.inventoryService.maxStackSize >= 10000 && this.inventoryService.thrownAwayItems >= 1000000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'All Things In Moderation',
      hint: 'Immortals know what to use and what to toss.',
      description:
        'You sold and used 8888 items and unlocked the ' + this.itemRepoService.items['autoBalanceManual'].name,
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 8888 && this.inventoryService.lifetimeSoldItems >= 8888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBalanceManual']);
      },
      unlocked: false,
    },
    {
      name: 'Land Rush',
      description:
        'You owned 520 plots of land and unlocked the ' + this.itemRepoService.items['autoBuyLandManual'].name,
      hint: 'Immortals are known for their vast real estate holdings.',
      check: () => {
        return this.homeService.land >= 520;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyLandManual']);
      },
      unlocked: false,
    },
    {
      name: 'Real Housewives of Immortality',
      description:
        'You acquired a very fine home and unlocked the ' + this.itemRepoService.items['autoBuyHomeManual'].name,
      hint: 'Immortals value a good home.',
      check: () => {
        return this.homeService.homeValue >= HomeType.CourtyardHouse;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyHomeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Off to Ikea',
      description:
        'You filled all your furniture slots and unlocked the ' +
        this.itemRepoService.items['autoBuyFurnitureManual'].name,
      hint: 'Immortals have discerning taste in furnishings.',
      check: () => {
        return (
          this.homeService.furniture.bathtub !== null &&
          this.homeService.furniture.bed !== null &&
          this.homeService.furniture.kitchen !== null &&
          this.homeService.furniture.workbench !== null
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyFurnitureManual']);
      },
      unlocked: false,
    },
    {
      //TODO: rework this
      name: 'Time to Buy a Tractor',
      description: 'You plowed 888 fields and unlocked the ' + this.itemRepoService.items['autoFieldManual'].name,
      hint: 'An aspiring immortal should have vast tracts of fertile land.',
      check: () => {
        return this.farmService.fields.length + this.farmService.extraFields >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoFieldManual']);
      },
      unlocked: false,
    },
    {
      name: 'Industrial Revolution',
      description:
        "You've found all the basic autobuyers and unlocked the " +
        this.itemRepoService.items['autoBuyerSettingsManual'].name,
      hint: 'Become really, really lazy',
      check: () => {
        return (
          this.homeService.autoBuyHomeUnlocked &&
          this.homeService.autoBuyLandUnlocked &&
          this.farmService.autoFieldUnlocked &&
          this.homeService.autoBuyFurnitureUnlocked
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyerSettingsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Guzzler',
      description: 'You drank 88 potions and unlocked the ' + this.itemRepoService.items['autoPotionManual'].name,
      hint: 'Glug, glug, glug.',
      check: () => {
        return this.inventoryService.lifetimePotionsUsed >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPotionManual']);
      },
      unlocked: false,
    },
    {
      name: 'Junkie',
      description: 'You took 131 pills and unlocked the ' + this.itemRepoService.items['autoPillManual'].name,
      hint: 'An aspiring immortal should take the red one.<br>Take it over and over.',
      check: () => {
        return this.inventoryService.lifetimePillsUsed >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPillManual']);
      },
      unlocked: false,
    },
    {
      name: 'Monster Slayer',
      description: 'You killed 131 monsters and unlocked the ' + this.itemRepoService.items['autoTroubleManual'].name,
      hint: 'An aspiring immortal bravely faces down their foes.',
      check: () => {
        return this.battleService.troubleKills >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoTroubleManual']);
      },
      unlocked: false,
    },
    {
      name: 'Weapons Master',
      description:
        'You wielded powerful weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['autoWeaponMergeManual'].name,
      hint: 'Left and right.',
      check: () => {
        if (
          this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 60 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoWeaponMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Practically Invincible',
      description:
        'You equipped yourself with powerful armor and unlocked the ' +
        this.itemRepoService.items['autoArmorMergeManual'].name,
      hint: 'Suit up.',
      check: () => {
        if (
          this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoArmorMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gemologist',
      description: 'You acquired 88 gems and unlocked the ' + this.itemRepoService.items['useSpiritGemManual'].name,
      hint: 'Ooh, shiny.',
      check: () => {
        return this.battleService.troubleKills > 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['useSpiritGemManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ingredient Snob',
      description:
        'You achieved a deep understanding of herbs and unlocked the ' +
        this.itemRepoService.items['bestHerbsManual'].name,
      hint: 'An aspiring immortal should take the red one. Take it over and over.',
      check: () => {
        return (
          this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.waterLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHerbsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Wood Snob',
      description:
        'You achieved a deep understanding of wood and unlocked the ' +
        this.itemRepoService.items['bestWoodManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.intelligence.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWoodManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ore Snob',
      displayName: 'Smelting Snob',
      description:
        'You achieved a deep understanding of digging and smelting metal and unlocked the ' +
        this.itemRepoService.items['bestOreManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.characterState.attributes.metalLore.value > 1024 &&
          this.characterService.characterState.attributes.earthLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestOreManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hide Snob',
      displayName: 'Hunting Snob',
      description:
        'You achieved a deep understanding of hunting and gathering hides and unlocked the ' +
        this.itemRepoService.items['bestHidesManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.characterState.attributes.animalHandling.value > 1024 &&
          this.characterService.characterState.attributes.speed.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHidesManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gem Snob',
      description: 'You have sold 888 gems and unlocked the ' + this.itemRepoService.items['bestGemsManual'].name,
      hint: 'I hear the market for fine jewelry is so hot right now.',
      check: () => {
        return this.inventoryService.lifetimeGemsSold >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestGemsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Unlimited Taels',
      description:
        'Your family has unlocked the secrets of compound interest.<br>You probably never have to worry about money again.',
      hint: 'Family first. Especially in matters of money.',
      check: () => {
        return this.characterService.characterState.bloodlineRank >= 4;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Not Unlimited Taels',
      description:
        "You filled up your purse, your wall safe, the box under your bed, and a giant money pit in the backyard.<br>You just can't hold any more money.",
      hint: 'How rich can you get?',
      check: () => {
        return this.characterService.characterState.money >= this.characterService.characterState.maxMoney - 1e21; //not exactly max in case this gets checked at a bad time
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: "Grandpa's Old Tent",
      description: "You've gone through four cycles of reincarnation and come to understand the value of grandfathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.totalLives > 4;
      },
      effect: () => {
        this.homeService.grandfatherTent = true;
      },
      unlocked: false,
    },
    {
      name: 'Paternal Pride',
      description: "You've worked 888 days of odd jobs and come to understand the value of fathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.oddJobDays > 888;
      },
      effect: () => {
        this.characterService.fatherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Maternal Love',
      description: "You've done 888 days of begging and come to understand the value of mothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.beggingDays > 888;
      },
      effect: () => {
        this.inventoryService.motherGift = true;
      },
      unlocked: false,
    },
    {
      name: "Grandma's Stick",
      description: "You've developed spirituality and come to understand the value of grandmothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.attributes.spirituality.value > 0;
      },
      effect: () => {
        this.inventoryService.grandmotherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Weapons Grandmaster',
      description:
        'You wielded epic weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['bestWeaponManual'].name,
      hint: 'Power level 10,000!',
      check: () => {
        if (
          this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 8888 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWeaponManual']);
      },
      unlocked: false,
    },
    {
      name: 'Tank!',
      description:
        'You armored yourself with epic defenses and unlocked the ' +
        this.itemRepoService.items['bestArmorManual'].name,
      hint: "Don't hurt me!",
      check: () => {
        if (
          this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestArmorManual']);
      },
      unlocked: false,
    },
    {
      name: "You're a wizard now.",
      description:
        'Enlightenment!<br>You have achieved a permanent and deep understanding of elemental balance with your high, balanced levels of lore in each of the five elements.<br>Qi is now unlocked for all future lives.',
      hint: 'Seek the balance of the dao.',
      check: () => {
        const fireLore = this.characterService.characterState.attributes.fireLore.value;
        const earthLore = this.characterService.characterState.attributes.earthLore.value;
        const woodLore = this.characterService.characterState.attributes.woodLore.value;
        const waterLore = this.characterService.characterState.attributes.waterLore.value;
        const metalLore = this.characterService.characterState.attributes.metalLore.value; //Reduce the bulk

        const lowValue = Math.min(metalLore, waterLore, woodLore, earthLore, fireLore);
        const highValue = Math.max(metalLore, waterLore, woodLore, earthLore, fireLore);
        return lowValue >= 1000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.characterService.characterState.qiUnlocked = true;
        if (this.characterService.characterState.status.qi.max === 0) {
          this.characterService.characterState.status.qi.max = 1;
          this.characterService.characterState.status.qi.value = 1;
        }
        this.activityService.reloadActivities();
      },
      unlocked: false,
    },
    {
      name: 'Sect Leader',
      description: 'You have become powerful enough that you may now start attracting followers.',
      hint: 'Ascension has its privileges.',
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 1 &&
          this.characterService.meridianRank() >= 1 &&
          this.characterService.characterState.bloodlineRank >= 1
        );
      },
      effect: () => {
        this.followerService.followersUnlocked = true;
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        this.gameStateService?.unlockPanel('followersPanel');
      },
      unlocked: false,
    },
    {
      name: 'Impossible',
      description: 'You have achieved incredible power and are ready to begin taking on impossible tasks.',
      hint: "No one can exceed the limits of humanity. It can't be done.",
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 9 &&
          this.characterService.meridianRank() >= 9 &&
          this.characterService.characterState.bloodlineRank >= 5
        );
      },
      effect: () => {
        this.impossibleTaskService.impossibleTasksUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Sturdy Walls',
      description: 'You have built a home strong enough to endure for generations.',
      hint: 'Build back better.',
      check: () => {
        return this.homeService.home.type >= HomeType.SimpleHut;
      },
      effect: () => {
        this.homeService.keepHome = true;
      },
      unlocked: false,
    },
    {
      name: 'Eternal Nation',
      description: 'You have established an empire that will never fall, and a bloodline that will always inherit it.',
      hint: 'Bloodline Empire.',
      check: () => {
        return (
          this.homeService.home.type >= HomeType.Capital && this.characterService.characterState.bloodlineRank >= 7
        );
      },
      effect: () => {
        this.characterService.characterState.imperial = true;
      },
      unlocked: false,
    },
    {
      name: 'Limit Breaker',
      description: 'You have broken past human limits and improve constantly! What new fate awaits you?',
      hint: '999',
      check: () => {
        return this.characterService.characterState.bloodlineRank >= 9;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Harmony of Mind and Body',
      description:
        'You have balanced your powerful mind and body and unlocked the ability to use your Qi to strike down your enemies.',
      hint: 'The dao embraces all things in perfect harmony.',
      check: () => {
        const speed = this.characterService.characterState.attributes.speed.value;
        const toughness = this.characterService.characterState.attributes.toughness.value;
        const charisma = this.characterService.characterState.attributes.charisma.value;
        const intelligence = this.characterService.characterState.attributes.intelligence.value;
        const strength = this.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.qiAttackUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Unity of Spirit, Mind, and Body',
      description:
        'You have balanced your powerful spirit with your mind and body.<br>You unlocked the ability to use your Qi to protect yourself.',
      hint: 'The dao embraces all things in perfect harmony.',
      check: () => {
        const spirituality = this.characterService.characterState.attributes.spirituality.value;
        const speed = this.characterService.characterState.attributes.speed.value;
        const toughness = this.characterService.characterState.attributes.toughness.value;
        const charisma = this.characterService.characterState.attributes.charisma.value;
        const intelligence = this.characterService.characterState.attributes.intelligence.value;
        const strength = this.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength, spirituality);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength, spirituality);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.qiShieldUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Disposable Followers',
      description:
        'You have recruited so many people you can now freely dismiss followers using the ' +
        this.itemRepoService.items['followerAutoDismissManual'].name,
      hint: 'The One Hundred Companions.',
      check: () => {
        return this.followerService.followersRecruited >= 100;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['followerAutoDismissManual']);
      },
      unlocked: false,
    },
    {
      name: 'Loyal Followers',
      description:
        "One of your followers has trained under you so long they have nothing else to learn.<br>In an epiphany you realized how to double your new followers' lifespan.",
      hint: 'Endless training.',
      check: () => {
        return this.followerService.highestLevel >= 100;
      },
      effect: () => {
        this.followerService.followerLifespanDoubled = true;
      },
      unlocked: false,
    },
    {
      name: 'Ascension',
      description: 'You have developed enough spirituality to ascend.',
      hint: 'Only with spiritual development can you ascend to higher states.',
      check: () => {
        return this.characterService.characterState.attributes.spirituality.value >= 10;
      },
      effect: () => {
        this.characterService.characterState.ascensionUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: "I don't want to go.",
      description:
        'You have lived many lives and unlocked the ' + this.itemRepoService.items['autoPauseSettingsManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.totalLives >= 48 && this.mainLoopService.totalTicks > 18250;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPauseSettingsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Good',
      description:
        "You have collected two hour's worth of offline ticks and unlocked the " +
        this.itemRepoService.items['bankedTicksEfficiencyManual'].name,
      hint: 'Take a day off from cultivating.', //it takes 20h to get
      check: () => {
        return this.mainLoopService.bankedTicks > 2 * 60 * 60 * 40; //there are 40 ticks a second
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bankedTicksEfficiencyManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Bad',
      description:
        'You died from overwork performing an activity without necessary rest and unlocked the ' +
        this.itemRepoService.items['autoRestManual'].name,
      hint: "There's no time to rest, cultivating is life.",
      check: () => {
        return this.activityService.activityDeath || this.characterService.characterState.immortal;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoRestManual']);
      },
      unlocked: false,
    },
    {
      name: 'Still Spry',
      description:
        'You have lived to be 300 years old and unlocked the ' + this.itemRepoService.items['ageSpeedManual'].name,
      hint: 'One step to becoming immortal is to live longer.',
      check: () => {
        return this.characterService.characterState.age > 300 * 365;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['ageSpeedManual']);
      },
      unlocked: false,
    },
    {
      name: 'Immortality',
      description: 'Congratulations! You are now immortal.',
      hint: 'Name of the game.',
      check: () => {
        return this.characterService.characterState.immortal;
      },
      effect: () => {
        this.activityService.reloadActivities();
      },
      unlocked: false,
    },
    {
      name: 'Headhunter',
      description: "You've sorted through so many applicants that you can now always find followers you want.",
      hint: "You didn't really want one thousand scouts, did you?",
      check: () => {
        return this.followerService.totalDismissed > 888;
      },
      effect: () => {
        this.followerService.onlyWantedFollowers = true;
      },
      unlocked: false,
    },
    {
      name: 'Yes We Can!',
      description: 'You found him.',
      hint: 'Can we fix it?',
      check: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Robert' || follower.name === 'Bob') && follower.job === 'builder') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: "Don't mess with Grandma",
      description: 'You have crafted the mightiest stick.<br>Grandmother would be so proud.',
      hint: 'The best stick.',
      check: () => {
        if (this.characterService.characterState.equipment.leftHand?.name === "Grandmother's Walking Stick") {
          if ((this.characterService.characterState.equipment.leftHand.weaponStats?.baseDamage || 0) > 1e9) {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Smooth Farming',
      description:
        'You have harvested crops every day for months and can now count on more regular and reliable harvests.',
      hint: "When starting your garden, it's best to work a little every day.",
      check: () => {
        return this.farmService.consecutiveHarvests >= 60;
      },
      effect: () => {
        this.homeService.smoothFarming = true;
      },
      unlocked: false,
    },
    {
      name: "They're Great",
      description: 'You have made a friend who can provide you with a tasty breakfast.',
      hint: "You'll need to find a very special pet.",
      check: () => {
        for (const follower of this.followerService.pets) {
          if ((follower.name === 'Tony' || follower.name === 'Antonio') && follower.job === 'tiger') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Let It Burn',
      description: 'You have burned an insane amount of money.',
      hint: "You didn't want that money anyway.",
      check: () => {
        return this.hellService.burnedMoney > 1e9;
      },
      effect: () => {
        this.hellService.fasterHellMoney = true;
      },
      unlocked: false,
    },
    {
      name: 'Peaches Peaches Peaches',
      description: "They're so good, you just want to drink them down.",
      hint: 'There is more alchemy to learn.',
      check: () => {
        return this.inventoryService.divinePeachesUnlocked;
      },
      effect: () => {
        if (this.characterService.characterState.itemPouches.length < 1) {
          // open up an item pouch slot if one isn't open yet
          this.characterService.characterState.itemPouches.push(this.inventoryService.getEmptyItemStack());
        }
      },
      unlocked: false,
    },
    {
      name: 'Rise of the God Slayers',
      description: "A new threat has emerged, more powerful than anything you've ever faced.",
      hint: 'Godhood comes with issues.',
      check: () => {
        return this.characterService.characterState.god;
      },
      effect: () => {
        this.battleService.godSlayersUnlocked = true;
        this.battleService.godSlayersEnabled = true;
      },
      unlocked: false,
    },
  ];

  unlockAchievement(achievement: Achievement, newAchievement: boolean) {
    if (!this.gameStateService) {
      this.gameStateService = this.injector.get(GameStateService);
    }
    if (newAchievement) {
      this.unlockedAchievements.push(achievement.name);
      this.logService.log(LogTopic.STORY, achievement.description);
      // check if gameStateService is injected yet, if not, inject it (circular dependency issues)
      this.characterService.toast(
        'Achievement Unlocked: ' + (achievement.displayName ? achievement.displayName : achievement.name)
      );
    }
    achievement.effect();
    achievement.unlocked = true;
    if (newAchievement) {
      this.gameStateService?.savetoLocalStorage();
    }
  }

  getProperties(): AchievementProperties {
    return {
      unlockedAchievements: this.unlockedAchievements,
    };
  }

  setProperties(properties: AchievementProperties) {
    this.unlockedAchievements = properties.unlockedAchievements || [];
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.name)) {
        this.unlockAchievement(achievement, false);
      }
    }
  }
}

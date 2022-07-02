import { Injectable, Injector, OnInit } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from './character.service';
import { Furniture, InventoryService, Item, instanceOfFurniture } from './inventory.service';
import { HomeService, HomeType, Home } from './home.service';
import { ItemRepoService } from './item-repo.service';
import { StoreService } from './store.service';
import { MainLoopService } from './main-loop.service';
import { BattleService } from './battle.service';
import { GameStateService } from './game-state.service';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity';
import { ImpossibleTaskService } from './impossibleTask.service';
import { FollowersService } from './followers.service';

export interface Achievement {
  name: string;
  description: string;
  hint: string;
  check: () => boolean;
  effect: () => void;
  unlocked: boolean;
}

export interface AchievementProperties {
  unlockedAchievements: string[]
}

@Injectable({
  providedIn: 'root'
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
    private activityService: ActivityService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService
  ) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      for (let achievement of this.achievements) {
        if (!this.unlockedAchievements.includes(achievement.name)){
          if (achievement.check()){
            this.unlockAchievement(achievement, true);
          }
        }
      }
    });
  }

  // important: achievement effects must be idempotent as they may be called multiple times
  achievements: Achievement[] = [
    {
      name: "Bookworm",
      description: "You opened the manuals shop and unlocked the " + this.itemRepoService.items['restartActivityManual'].name,
      hint: "There are lots of buttons in this game, maybe an aspiring immortal should press a few.",
      check: () => {
        return this.storeService.storeOpened;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['restartActivityManual']);
      },
      unlocked: false
    },
    {
      name: "Played a Bit",
      description: "You worked toward immortality for ten years across your lifetimes and unlocked the " + this.itemRepoService.items['fastPlayManual'].name,
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 3650;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Basically an Expert",
      description: "You worked toward immortality for one hundred years across your lifetimes and unlocked the " + this.itemRepoService.items['fasterPlayManual'].name,
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fasterPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Persitent Reincarnator",
      description: "You lived 88 lives and unlocked the " + this.itemRepoService.items['fastestPlayManual'].name,
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.totalLives >= 88 && this.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastestPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Clang! Clang! Clang!",
      description: "You reached proficiency in blacksmithing and can now work as a Blacksmith without going through an apprenticeship (you still need the attributes for the Blacksmithing activity).",
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Bubble, Bubble",
      description: "You reached proficiency in alchemy and can now work as a Alchemist without going through an apprenticeship (you still need the attributes for the Alchemy activity).",
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Alchemy);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Tanner",
      description: "You reached proficiency in leatherworking and can now work as a Leatherworker without going through an apprenticeship (you still need the attributes for the Leatherworking activity).",
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Carpenter",
      description: "You reached proficiency in woodworking and can now work as a Woodworker without going through an apprenticeship (you still need the attributes for the Woodworking activity).",
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Woodworking);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "This Sparks Joy",
      description: "You used 888 items and unlocked the " + this.itemRepoService.items['autoUseManual'].name,
      hint: "Immortals should know the potential of the things they use.",
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoUseManual']);
      },
      unlocked: false
    },
    {
      name: "This Does Not Spark Joy",
      description: "You filled your entire inventory and unlocked the " + this.itemRepoService.items['autoSellManual'].name,
      hint: "So much stuff.",
      check: () => {
        return this.inventoryService.openInventorySlots() == 0;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoSellManual']);
      },
      unlocked: false
    },
    {
      name: "Waster",
      description: "You throw away 10,000 items and unlocked the " + this.itemRepoService.items['betterStorageManual'].name,
      hint: "Too much stuff.",
      check: () => {
        return this.inventoryService.thrownAwayItems >= 10000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['betterStorageManual']);
      },
      unlocked: false
    },
    {
      name: "Landfill",
      description: "You throw away 100,000 items and unlocked the " + this.itemRepoService.items['evenBetterStorageManual'].name,
      hint: "Way, way too much stuff.",
      check: () => {
        return this.inventoryService.maxStackSize >= 1000 && this.inventoryService.thrownAwayItems >= 100000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['evenBetterStorageManual']);
      },
      unlocked: false
    },
    {
      name: "Hoarder",
      description: "You really love holding vast amounts of materials and unlocked the " + this.itemRepoService.items['bestStorageManual'].name,
      hint: "Just stop already, it's too much. Why would an aspiring immortal need this much?",
      check: () => {
        return this.inventoryService.maxStackSize >= 10000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestStorageManual']);
      },
      unlocked: false
    },
    {
      name: "All Things In Moderation",
      hint: "Immortals know what to use and what to toss.",
      description: "You sold and used 8888 items and unlocked the " + this.itemRepoService.items['autoBalanceManual'].name,
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 8888 && this.inventoryService.lifetimeSoldItems >= 8888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBalanceManual']);
      },
      unlocked: false
    },
    {
      name: "Land Rush",
      description: "You owned 520 plots of land and unlocked the " + this.itemRepoService.items['autoBuyLandManual'].name,
      hint: "Immortals are known for their vast real estate holdings.",
      check: () => {
        return this.homeService.land >= 520;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyLandManual']);
      },
      unlocked: false
    },
    {
      name: "Real Housewives of Immortality",
      description: "You acquired a very fine home and unlocked the " + this.itemRepoService.items['autoBuyHomeManual'].name,
      hint: "Immortals value a good home.",
      check: () => {
        return this.homeService.homeValue >= HomeType.CourtyardHouse;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyHomeManual']);
      },
      unlocked: false
    },
    {
      name: "Off to Ikea",
      description: "You filled all your furniture slots and unlocked the " + this.itemRepoService.items['autoBuyFurnitureManual'].name,
      hint: "Immortals have discerning taste in furnishings.",
      check: () => {
        return this.homeService.furniture.bathtub != null &&
          this.homeService.furniture.bed != null &&
          this.homeService.furniture.kitchen != null &&
          this.homeService.furniture.workbench != null;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyFurnitureManual']);
      },
      unlocked: false
    },
    {
      name: "Time to Buy a Tractor",
      description: "You plowed 888 fields and unlocked the " + this.itemRepoService.items['autoFieldManual'].name,
      hint: "An aspiring immortal should have vast tracts of fertile land.",
      check: () => {
        return this.homeService.fields.length >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoFieldManual']);
      },
      unlocked: false
    },
    {
      name: "Guzzler",
      description: "You drank 88 potions and unlocked the " + this.itemRepoService.items['autoPotionManual'].name,
      hint: "Glug, glug, glug.",
      check: () => {
        return this.inventoryService.lifetimePotionsUsed >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPotionManual']);
      },
      unlocked: false
    },
    {
      name: "Junkie",
      description: "You took 131 pills and unlocked the " + this.itemRepoService.items['autoPillManual'].name,
      hint: "An aspiring immortal should take the red one. Take it over and over.",
      check: () => {
        return this.inventoryService.lifetimePillsUsed >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPillManual']);
      },
      unlocked: false
    },
    {
      name: "Monster Slayer",
      description: "You killed 131 monsters and unlocked the " + this.itemRepoService.items['autoTroubleManual'].name,
      hint: "An aspiring immortal bravely faces down their foes.",
      check: () => {
        return this.battleService.troubleKills >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoTroubleManual']);
      },
      unlocked: false
    },
    {
      name: "Weapons Master",
      description: "You wielded powerful weapons of both metal and wood and unlocked the " + this.itemRepoService.items['autoWeaponMergeManual'].name,
      hint: "Left and right.",
      check: () => {
        if (this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 131 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 131
          ){
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoWeaponMergeManual']);
      },
      unlocked: false
    },
    {
      name: "Practically Invincible",
      description: "You equipped yourself with powerful armor and unlocked the " + this.itemRepoService.items['autoArmorMergeManual'].name,
      hint: "Suit up.",
      check: () => {
        if (this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 131 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 131 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 131 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 131){
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoArmorMergeManual']);
      },
      unlocked: false
    },
    {
      name: "Gemologist",
      description: "You acquired 88 gems and unlocked the " + this.itemRepoService.items['useSpiritGemManual'].name,
      hint: "Ooh, shiny.",
      check: () => {
        return this.battleService.troubleKills > 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['useSpiritGemManual']);
      },
      unlocked: false
    },
    {
      name: "Ingredient Snob",
      description: "You achieved a deep understanding of herbs and unlocked the " + this.itemRepoService.items['bestHerbsManual'].name,
      hint: "An aspiring immortal should take the red one. Take it over and over.",
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.waterLore.value > 1024;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHerbsManual']);
      },
      unlocked: false
    },
    {
      name: "Wood Snob",
      description: "You achieved a deep understanding of wood and unlocked the " + this.itemRepoService.items['bestWoodManual'].name,
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.intelligence.value > 1024;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWoodManual']);
      },
      unlocked: false
    },
    {
      name: "Ore Snob",
      description: "You achieved a deep understanding of metal ore and unlocked the " + this.itemRepoService.items['bestOreManual'].name,
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.characterService.characterState.attributes.metalLore.value > 1024 &&
          this.characterService.characterState.attributes.earthLore.value > 1024;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestOreManual']);
      },
      unlocked: false
    },
    {
      name: "Grandpa's Old Tent",
      description: "You've gone through eight cycles of reincarnation and come to understand the value of grandfathers.",
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.totalLives > 8;
      },
      effect: () => {
        this.homeService.grandfatherTent = true;
      },
      unlocked: false
    },
    {
      name: "Paternal Pride",
      description: "You've worked 888 days of odd jobs and come to understand the value of fathers.",
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.oddJobDays > 888;
      },
      effect: () => {
        this.characterService.fatherGift = true;
      },
      unlocked: false
    },
    {
      name: "Maternal Love",
      description: "You've done 888 days of begging and come to understand the value of mothers.",
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.beggingDays > 888;
      },
      effect: () => {
        this.inventoryService.motherGift = true;
      },
      unlocked: false
    },
    {
      name: "Grandma's Stick",
      description: "You've developed spirituality and come to understand the value of grandmothers.",
      hint: "Just keep playing, I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.characterState.attributes.spirituality.value > 0;
      },
      effect: () => {
        this.inventoryService.grandmotherGift = true;
      },
      unlocked: false
    },
    {
      name: "Weapons Grandmaster",
      description: "You wielded epic weapons of both metal and wood and unlocked the " + this.itemRepoService.items['bestWeaponManual'].name,
      hint: "Power level 10,000!",
      check: () => {
        if (this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 8888 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 8888
          ){
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWeaponManual']);
      },
      unlocked: false
    },
    {
      name: "Tank!",
      description: "You armored yourself with epic defenses and unlocked the " + this.itemRepoService.items['bestArmorManual'].name,
      hint: "Don't hurt me!",
      check: () => {
        if (this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 8888){
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestArmorManual']);
      },
      unlocked: false
    },
    {
      name: "You're a wizard now.",
      description: "Enlightenment! You found a deep understanding of the dao with a high, balanced levels of lore in each of the five elements. Mana is now unlocked.",
      hint: "Seek the balance of the dao.",
      check: () => {
        let lowValue = this.characterService.characterState.attributes.metalLore.value * 0.9;
        let highValue = this.characterService.characterState.attributes.metalLore.value * 1.1;
        return lowValue > 1000 &&
          this.characterService.characterState.attributes.fireLore.value >= lowValue &&
          this.characterService.characterState.attributes.fireLore.value <= highValue &&
          this.characterService.characterState.attributes.earthLore.value >= lowValue &&
          this.characterService.characterState.attributes.earthLore.value <= highValue &&
          this.characterService.characterState.attributes.woodLore.value >= lowValue &&
          this.characterService.characterState.attributes.woodLore.value <= highValue &&
          this.characterService.characterState.attributes.waterLore.value >= lowValue &&
          this.characterService.characterState.attributes.waterLore.value <= highValue;
      },
      effect: () => {
        this.characterService.characterState.manaUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Sect Leader",
      description: "You have become powerful enough that you may now start attracting followers.",
      hint: "Ascension has its privileges.",
      check: () => {
        return (this.characterService.soulCoreRank() >= 1) &&
          (this.characterService.meridianRank() >= 1) &&
          this.characterService.characterState.bloodlineRank >= 1;
      },
      effect: () => {
        this.followerService.followersUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Impossible",
      description: "You have achieved incredible power and are ready to begin taking on impossible tasks.",
      hint: "No one can achieve this. It can't be done.",
      check: () => {
        return (this.characterService.soulCoreRank() >= 4) &&
          (this.characterService.meridianRank() >= 4) &&
          this.characterService.characterState.bloodlineRank >= 4;
      },
      effect: () => {
        this.impossibleTaskService.impossibleTasksUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Harmony of Mind and Body",
      description: "You have balanced your powerful mind and body and unlocked the ability to use your mana to strike down your enemies.",
      hint: "The dao embraces all things in perfect harmony.",
      check: () => {
        let lowValue = this.characterService.characterState.attributes.strength.value * 0.9;
        let highValue = this.characterService.characterState.attributes.strength.value * 1.1;
        return this.characterService.characterState.manaUnlocked && lowValue > 1000000 &&
          this.characterService.characterState.attributes.speed.value >= lowValue &&
          this.characterService.characterState.attributes.speed.value <= highValue &&
          this.characterService.characterState.attributes.toughness.value >= lowValue &&
          this.characterService.characterState.attributes.toughness.value <= highValue &&
          this.characterService.characterState.attributes.charisma.value >= lowValue &&
          this.characterService.characterState.attributes.charisma.value <= highValue &&
          this.characterService.characterState.attributes.intelligence.value >= lowValue &&
          this.characterService.characterState.attributes.intelligence.value <= highValue;
      },
      effect: () => {
        this.battleService.manaAttackUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Unity of Spirit, Mind, and Body",
      description: "You have balanced your powerful spirit with your mind and body. You unlocked the ability to use your mana to protect yourself.",
      hint: "The dao embraces all things in perfect harmony.",
      check: () => {
        let lowValue = this.characterService.characterState.attributes.strength.value * 0.9;
        let highValue = this.characterService.characterState.attributes.strength.value * 1.1;
        return this.characterService.characterState.manaUnlocked && lowValue > 1000000 &&
          this.characterService.characterState.attributes.spirituality.value >= lowValue &&
          this.characterService.characterState.attributes.spirituality.value <= highValue &&
          this.characterService.characterState.attributes.speed.value >= lowValue &&
          this.characterService.characterState.attributes.speed.value <= highValue &&
          this.characterService.characterState.attributes.toughness.value >= lowValue &&
          this.characterService.characterState.attributes.toughness.value <= highValue &&
          this.characterService.characterState.attributes.charisma.value >= lowValue &&
          this.characterService.characterState.attributes.charisma.value <= highValue &&
          this.characterService.characterState.attributes.intelligence.value >= lowValue &&
          this.characterService.characterState.attributes.intelligence.value <= highValue;
      },
      effect: () => {
        this.battleService.manaShieldUnlocked = true;
      },
      unlocked: false
    }
  ];

  unlockAchievement(achievement: Achievement, newAchievement: boolean){
    if (newAchievement){
      this.unlockedAchievements.push(achievement.name);
      this.logService.addLogMessage(achievement.description, 'STANDARD', 'STORY');
      // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
      if (!this.gameStateService){
        this.gameStateService = this.injector.get(GameStateService);
      }
      this.gameStateService.savetoLocalStorage();
    }
    achievement.effect();
    achievement.unlocked = true;
  }

  getProperties(): AchievementProperties {
    return {
      unlockedAchievements: this.unlockedAchievements
    }
  }

  setProperties(properties: AchievementProperties) {
    this.unlockedAchievements = properties.unlockedAchievements || [];
    for (let achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.name)){
        this.unlockAchievement(achievement, false);
      }
    }
  }

}

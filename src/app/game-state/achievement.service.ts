import { Injectable } from '@angular/core';
import { HomeType } from './home.service';
import { ActivityType } from './activity';
import { ServicesService } from './services.service';

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
  unlockedAchievements: string[]
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  unlockedAchievements: string[] = [];
  achievements: Achievement[] = [];

  constructor(private services: ServicesService) {}

  init(): AchievementService {
    this.populateAchievements();
    this.services.mainLoopService.longTickSubject.subscribe(() => {
      for (const achievement of this.achievements) {
        if (!this.unlockedAchievements.includes(achievement.name)) {
          if (achievement.check()) {
            this.unlockAchievement(achievement, true);
          }
        }
      }
    });
    return this;
  }

  populateAchievements(): void {
  this.achievements = [
    {
      name: "Bookworm",
      description: "You opened the manuals shop and unlocked the " + this.services.itemRepoService.items['restartActivityManual'].name,
      hint: "There are lots of buttons in this game, maybe an aspiring immortal should press a few.",
      check: () => {
        return this.services.storeService.storeOpened;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['restartActivityManual']);
      },
      unlocked: false
    },
    {
      name: "Played a Bit",
      description: "You worked toward immortality for ten years across your lifetimes and unlocked the " + this.services.itemRepoService.items['fastPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.mainLoopService.totalTicks > 3650;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['fastPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Basically an Expert",
      description: "You worked toward immortality for one hundred years across your lifetimes and unlocked the " + this.services.itemRepoService.items['fasterPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['fasterPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Persistent Reincarnator",
      description: "You lived one thousand years across your lifetimes and unlocked the " + this.services.itemRepoService.items['fastestPlayManual'].name,
      hint: "The millennial.",
      check: () => {
        return this.services.mainLoopService.totalTicks > 365000;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['fastestPlayManual']);
      },
      unlocked: false
    },
    {
      name: "Veteran Cultivator",
      description: "You lived ten thousand years across your lifetimes and unlocked the " + this.services.itemRepoService.items['totalPlaytimeManual'].name,
      hint: "A long life. Myriad years.",
      check: () => {
        return this.services.mainLoopService.totalTicks > 3650000;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['totalPlaytimeManual']);
      },
      unlocked: false
    },
    {
      name: "Clang! Clang! Clang!",
      description: "You reached proficiency in blacksmithing and can now work as a Blacksmith without going through an apprenticeship (you still need the attributes for the Blacksmithing activity).",
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.services.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing);
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
        return this.services.activityService.completedApprenticeships.includes(ActivityType.Alchemy);
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
        return this.services.activityService.completedApprenticeships.includes(ActivityType.Leatherworking);
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
        return this.services.activityService.completedApprenticeships.includes(ActivityType.Woodworking);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Addict",
      description: "You got a taste of those sweet, sweet empowerment pills and want more.",
      hint: "Master of all.",
      check: () => {
        return this.services.characterService.characterState.empowermentFactor > 1;
      },
      effect: () => { //TODO: Create a downside to taking empowerment pills, maybe post-Death
      },
      unlocked: false
    },
    {
      name: "Habitual User",
      displayName: "Dope",
      description: "You got every last drop you could out of those pills and now you feel nothing from them. At least they didn't kill you or do lasting harm, right?",
      hint: "D.A.R.E.",
      check: () => {
        return this.services.characterService.characterState.empowermentFactor >= 1953.65;
      },
      effect: () => { //TODO: Create a downside to taking HUGE NUMBERS of empowerment pills, maybe in Hell?
      },
      unlocked: false
    },
    {
      name: "This Sparks Joy",
      description: "You used 888 items and unlocked the " + this.services.itemRepoService.items['autoUseManual'].name,
      hint: "Immortals should know the potential of the things they use.",
      check: () => {
        return this.services.inventoryService.lifetimeUsedItems >= 888;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoUseManual']);
      },
      unlocked: false
    },
    {
      name: "This Does Not Spark Joy",
      description: "You filled your entire inventory and unlocked the " + this.services.itemRepoService.items['autoSellManual'].name,
      hint: "So much stuff.",
      check: () => {
        return this.services.inventoryService.openInventorySlots() === 0;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoSellManual']);
      },
      unlocked: false
    },
    {
      name: "Waster",
      description: "You throw away 10,000 items and unlocked the " + this.services.itemRepoService.items['betterStorageManual'].name,
      hint: "Too much stuff.",
      check: () => {
        return this.services.inventoryService.thrownAwayItems >= 10000;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['betterStorageManual']);
      },
      unlocked: false
    },
    {
      name: "Landfill",
      description: "You throw away 100,000 items and unlocked the " + this.services.itemRepoService.items['evenBetterStorageManual'].name,
      hint: "Way, way too much stuff.",
      check: () => {
        return this.services.inventoryService.maxStackSize >= 1000 && this.services.inventoryService.thrownAwayItems >= 100000;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['evenBetterStorageManual']);
      },
      unlocked: false
    },
    {
      name: "Hoarder",
      description: "You really love holding vast amounts of materials and unlocked the " + this.services.itemRepoService.items['bestStorageManual'].name,
      hint: "Just stop already, it's too much. Why would an aspiring immortal need this much?",
      check: () => {
        return this.services.inventoryService.maxStackSize >= 10000 && this.services.inventoryService.thrownAwayItems >= 1000000;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestStorageManual']);
      },
      unlocked: false
    },
    {
      name: "All Things In Moderation",
      hint: "Immortals know what to use and what to toss.",
      description: "You sold and used 8888 items and unlocked the " + this.services.itemRepoService.items['autoBalanceManual'].name,
      check: () => {
        return this.services.inventoryService.lifetimeUsedItems >= 8888 && this.services.inventoryService.lifetimeSoldItems >= 8888;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoBalanceManual']);
      },
      unlocked: false
    },
    {
      name: "Land Rush",
      description: "You owned 520 plots of land and unlocked the " + this.services.itemRepoService.items['autoBuyLandManual'].name,
      hint: "Immortals are known for their vast real estate holdings.",
      check: () => {
        return this.services.homeService.land >= 520;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoBuyLandManual']);
      },
      unlocked: false
    },
    {
      name: "Real Housewives of Immortality",
      description: "You acquired a very fine home and unlocked the " + this.services.itemRepoService.items['autoBuyHomeManual'].name,
      hint: "Immortals value a good home.",
      check: () => {
        return this.services.homeService.homeValue >= HomeType.CourtyardHouse;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoBuyHomeManual']);
      },
      unlocked: false
    },
    {
      name: "Off to Ikea",
      description: "You filled all your furniture slots and unlocked the " + this.services.itemRepoService.items['autoBuyFurnitureManual'].name,
      hint: "Immortals have discerning taste in furnishings.",
      check: () => {
        return this.services.homeService.furniture.bathtub !== null &&
          this.services.homeService.furniture.bed !== null &&
          this.services.homeService.furniture.kitchen !== null &&
          this.services.homeService.furniture.workbench !== null;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoBuyFurnitureManual']);
      },
      unlocked: false
    },
    {
      name: "Time to Buy a Tractor",
      description: "You plowed 888 fields and unlocked the " + this.services.itemRepoService.items['autoFieldManual'].name,
      hint: "An aspiring immortal should have vast tracts of fertile land.",
      check: () => {
        return this.services.homeService.fields.length + this.services.homeService.extraFields >= 888;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoFieldManual']);
      },
      unlocked: false
    },
    {
      name: "Industrial Revolution",
      description: "You've found all the basic autobuyers and unlocked the " + this.services.itemRepoService.items['autoBuyerSettingsManual'].name,
      hint: "Become really, really lazy",
      check: () => {
        return this.services.homeService.autoBuyHomeUnlocked &&
          this.services.homeService.autoBuyLandUnlocked &&
          this.services.homeService.autoFieldUnlocked &&
          this.services.homeService.autoBuyFurnitureUnlocked
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoBuyerSettingsManual']);
      },
      unlocked: false
    },
    {
      name: "Guzzler",
      description: "You drank 88 potions and unlocked the " + this.services.itemRepoService.items['autoPotionManual'].name,
      hint: "Glug, glug, glug.",
      check: () => {
        return this.services.inventoryService.lifetimePotionsUsed >= 88;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoPotionManual']);
      },
      unlocked: false
    },
    {
      name: "Junkie",
      description: "You took 131 pills and unlocked the " + this.services.itemRepoService.items['autoPillManual'].name,
      hint: "An aspiring immortal should take the red one. Take it over and over.",
      check: () => {
        return this.services.inventoryService.lifetimePillsUsed >= 131;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoPillManual']);
      },
      unlocked: false
    },
    {
      name: "Monster Slayer",
      description: "You killed 131 monsters and unlocked the " + this.services.itemRepoService.items['autoTroubleManual'].name,
      hint: "An aspiring immortal bravely faces down their foes.",
      check: () => {
        return this.services.battleService.troubleKills >= 131;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoTroubleManual']);
      },
      unlocked: false
    },
    {
      name: "Weapons Master",
      description: "You wielded powerful weapons of both metal and wood and unlocked the " + this.services.itemRepoService.items['autoWeaponMergeManual'].name,
      hint: "Left and right.",
      check: () => {
        if (this.services.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.services.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 60 &&
          this.services.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.services.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoWeaponMergeManual']);
      },
      unlocked: false
    },
    {
      name: "Practically Invincible",
      description: "You equipped yourself with powerful armor and unlocked the " + this.services.itemRepoService.items['autoArmorMergeManual'].name,
      hint: "Suit up.",
      check: () => {
        if (this.services.characterService.characterState.equipment?.head?.armorStats &&
          this.services.characterService.characterState.equipment?.head?.armorStats.defense >= 60 &&
          this.services.characterService.characterState.equipment?.body?.armorStats &&
          this.services.characterService.characterState.equipment?.body?.armorStats.defense >= 60 &&
          this.services.characterService.characterState.equipment?.legs?.armorStats &&
          this.services.characterService.characterState.equipment?.legs?.armorStats.defense >= 60 &&
          this.services.characterService.characterState.equipment?.feet?.armorStats &&
          this.services.characterService.characterState.equipment?.feet?.armorStats.defense >= 60) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoArmorMergeManual']);
      },
      unlocked: false
    },
    {
      name: "Gemologist",
      description: "You acquired 88 gems and unlocked the " + this.services.itemRepoService.items['useSpiritGemManual'].name,
      hint: "Ooh, shiny.",
      check: () => {
        return this.services.battleService.troubleKills > 88;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['useSpiritGemManual']);
      },
      unlocked: false
    },
    {
      name: "Ingredient Snob",
      description: "You achieved a deep understanding of herbs and unlocked the " + this.services.itemRepoService.items['bestHerbsManual'].name,
      hint: "An aspiring immortal should take the red one. Take it over and over.",
      check: () => {
        return this.services.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.services.characterService.characterState.attributes.waterLore.value > 1024;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestHerbsManual']);
      },
      unlocked: false
    },
    {
      name: "Wood Snob",
      description: "You achieved a deep understanding of wood and unlocked the " + this.services.itemRepoService.items['bestWoodManual'].name,
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.services.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.services.characterService.characterState.attributes.intelligence.value > 1024;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestWoodManual']);
      },
      unlocked: false
    },
    {
      name: "Ore Snob",
      displayName: "Smelting Snob",
      description: "You achieved a deep understanding of digging and smelting metal and unlocked the " + this.services.itemRepoService.items['bestOreManual'].name,
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.services.characterService.characterState.attributes.metalLore.value > 1024 &&
          this.services.characterService.characterState.attributes.earthLore.value > 1024;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestOreManual']);
      },
      unlocked: false
    },
    {
      name: "Hide Snob",
      displayName: "Hunting Snob",
      description: "You achieved a deep understanding of hunting and gathering hides and unlocked the " + this.services.itemRepoService.items['bestHidesManual'].name,
      hint: "There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.",
      check: () => {
        return this.services.characterService.characterState.attributes.animalHandling.value > 1024 &&
          this.services.characterService.characterState.attributes.speed.value > 1024;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestHidesManual']);
      },
      unlocked: false

    },
    {
      name: "Gem Snob",
      description: "You have sold 888 gems and unlocked the " + this.services.itemRepoService.items['bestGemsManual'].name,
      hint: "I hear the market for fine jewelry is so hot right now.",
      check: () => {
        return this.services.inventoryService.lifetimeGemsSold >= 888;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestGemsManual']);
      },
      unlocked: false
    },
    {
      name: "Unlimited Taels",
      description: "Your family has unlocked the secrets of compound interest. You probably never have to worry about money again.",
      hint: "Family first. Especially in matters of money.",
      check: () => {
        return this.services.characterService.characterState.bloodlineRank >= 4;
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Not Unlimited Taels",
      description: "You filled up your purse, your wall safe, the box under your bed, and a giant money pit in the backyard. You just can't hold any more money.",
      hint: "How rich can you get?",
      check: () => {
        return this.services.characterService.characterState.money >= this.services.characterService.characterState.maxMoney - 1e21; //not exactly max in case this gets checked at a bad time
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Grandpa's Old Tent",
      description: "You've gone through eight cycles of reincarnation and come to understand the value of grandfathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.characterService.characterState.totalLives > 8;
      },
      effect: () => {
        this.services.homeService.grandfatherTent = true;
      },
      unlocked: false
    },
    {
      name: "Paternal Pride",
      description: "You've worked 888 days of odd jobs and come to understand the value of fathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.activityService.oddJobDays > 888;
      },
      effect: () => {
        this.services.characterService.fatherGift = true;
      },
      unlocked: false
    },
    {
      name: "Maternal Love",
      description: "You've done 888 days of begging and come to understand the value of mothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.activityService.beggingDays > 888;
      },
      effect: () => {
        this.services.inventoryService.motherGift = true;
      },
      unlocked: false
    },
    {
      name: "Grandma's Stick",
      description: "You've developed spirituality and come to understand the value of grandmothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.characterService.characterState.attributes.spirituality.value > 0;
      },
      effect: () => {
        this.services.inventoryService.grandmotherGift = true;
      },
      unlocked: false
    },
    {
      name: "Weapons Grandmaster",
      description: "You wielded epic weapons of both metal and wood and unlocked the " + this.services.itemRepoService.items['bestWeaponManual'].name,
      hint: "Power level 10,000!",
      check: () => {
        if (this.services.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.services.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 8888 &&
          this.services.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.services.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestWeaponManual']);
      },
      unlocked: false
    },
    {
      name: "Tank!",
      description: "You armored yourself with epic defenses and unlocked the " + this.services.itemRepoService.items['bestArmorManual'].name,
      hint: "Don't hurt me!",
      check: () => {
        if (this.services.characterService.characterState.equipment?.head?.armorStats &&
          this.services.characterService.characterState.equipment?.head?.armorStats.defense >= 8888 &&
          this.services.characterService.characterState.equipment?.body?.armorStats &&
          this.services.characterService.characterState.equipment?.body?.armorStats.defense >= 8888 &&
          this.services.characterService.characterState.equipment?.legs?.armorStats &&
          this.services.characterService.characterState.equipment?.legs?.armorStats.defense >= 8888 &&
          this.services.characterService.characterState.equipment?.feet?.armorStats &&
          this.services.characterService.characterState.equipment?.feet?.armorStats.defense >= 8888) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bestArmorManual']);
      },
      unlocked: false
    },
    {
      name: "You're a wizard now.",
      description: "Enlightenment! You have achieved a permanent and deep understanding of elemental balance with your high, balanced levels of lore in each of the five elements. Mana is now unlocked for all future lives.",
      hint: "Seek the balance of the dao.",
      check: () => {
        const fireLore = this.services.characterService.characterState.attributes.fireLore.value;
        const earthLore = this.services.characterService.characterState.attributes.earthLore.value;
        const woodLore = this.services.characterService.characterState.attributes.woodLore.value;
        const waterLore = this.services.characterService.characterState.attributes.waterLore.value;
        const metalLore = this.services.characterService.characterState.attributes.metalLore.value; //Reduce the bulk

        const lowValue = Math.min(metalLore, waterLore, woodLore, earthLore, fireLore);
        const highValue = Math.max(metalLore, waterLore, woodLore, earthLore, fireLore);
        return lowValue >= 1000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.services.characterService.characterState.manaUnlocked = true;
        if (this.services.characterService.characterState.status.mana.max === 0) {
          this.services.characterService.characterState.status.mana.max = 1;
          this.services.characterService.characterState.status.mana.value = 1;
        }
        this.services.activityService.reloadActivities();
      },
      unlocked: false
    },
    {
      name: "Sect Leader",
      description: "You have become powerful enough that you may now start attracting followers.",
      hint: "Ascension has its privileges.",
      check: () => {
        return (this.services.characterService.soulCoreRank() >= 1) &&
          (this.services.characterService.meridianRank() >= 1) &&
          this.services.characterService.characterState.bloodlineRank >= 1;
      },
      effect: () => {
        this.services.followerService.followersUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Impossible",
      description: "You have achieved incredible power and are ready to begin taking on impossible tasks.",
      hint: "No one can exceed the limits of humanity. It can't be done.",
      check: () => {
        return (this.services.characterService.soulCoreRank() >= 9) &&
          (this.services.characterService.meridianRank() >= 9) &&
          this.services.characterService.characterState.bloodlineRank >= 5;
      },
      effect: () => {
        this.services.impossibleTaskService.impossibleTasksUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Eternal Nation",
      description: "You have established an empire that will never fall, and a bloodline that will always inherit it.",
      hint: "Bloodline Empire.",
      check: () => {
        return (this.services.homeService.home.type >= HomeType.Capital && this.services.characterService.characterState.bloodlineRank >= 7);
      },
      effect: () => {
        this.services.characterService.characterState.imperial = true;
      },
      unlocked: false
    },
    {
      name: "Limit Breaker",
      description: "You have broken past human limits and improve constantly! What new fate awaits you?",
      hint: "999",
      check: () => {
        return (this.services.characterService.characterState.bloodlineRank >= 9);
      },
      effect: () => {
      },
      unlocked: false
    },
    {
      name: "Harmony of Mind and Body",
      description: "You have balanced your powerful mind and body and unlocked the ability to use your mana to strike down your enemies.",
      hint: "The dao embraces all things in perfect harmony.",
      check: () => {
        const speed = this.services.characterService.characterState.attributes.speed.value;
        const toughness = this.services.characterService.characterState.attributes.toughness.value;
        const charisma = this.services.characterService.characterState.attributes.charisma.value;
        const intelligence = this.services.characterService.characterState.attributes.intelligence.value;
        const strength = this.services.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.services.battleService.manaAttackUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Unity of Spirit, Mind, and Body",
      description: "You have balanced your powerful spirit with your mind and body. You unlocked the ability to use your mana to protect yourself.",
      hint: "The dao embraces all things in perfect harmony.",
      check: () => {
        const spirituality = this.services.characterService.characterState.attributes.spirituality.value;
        const speed = this.services.characterService.characterState.attributes.speed.value;
        const toughness = this.services.characterService.characterState.attributes.toughness.value;
        const charisma = this.services.characterService.characterState.attributes.charisma.value;
        const intelligence = this.services.characterService.characterState.attributes.intelligence.value;
        const strength = this.services.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength, spirituality);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength, spirituality);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.services.battleService.manaShieldUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "Disposable Followers",
      description: "You have recruited so many people you can now freely dismiss followers using the " + this.services.itemRepoService.items['followerAutoDismissManual'].name,
      hint: "The One Hundred Companions.",
      check: () => {
        return this.services.followerService.followersRecruited >= 100;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['followerAutoDismissManual']);
      },
      unlocked: false
    },
    {
      name: "Loyal Followers",
      description: "One of your followers has trained under you so long they have nothing else to learn. In an epiphany you realized how to double your new followers' lifespan.",
      hint: "Endless training.",
      check: () => {
        return this.services.followerService.highestLevel >= 100;
      },
      effect: () => {
        this.services.followerService.followerLifespanDoubled = true;
      },
      unlocked: false
    },
    {
      name: "Ascension",
      description: "You have developed enough spirituality to ascend.",
      hint: "Only with spiritual development can you ascend to higher states.",
      check: () => {
        return this.services.characterService.characterState.attributes.spirituality.value >= 10;
      },
      effect: () => {
        this.services.characterService.characterState.ascensionUnlocked = true;
      },
      unlocked: false
    },
    {
      name: "I don't want to go.",
      description: "You have lived many lives and unlocked the " + this.services.itemRepoService.items['autoPauseSettingsManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.services.characterService.characterState.totalLives >= 48 && this.services.mainLoopService.totalTicks > 18250;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoPauseSettingsManual']);
      },
      unlocked: false
    },
    {
      name: "Breaks are Good",
      description: "You have collected two hour's worth of offline ticks and unlocked the " + this.services.itemRepoService.items['bankedTicksEfficiencyManual'].name,
      hint: "Take a day off from cultivating.", //it takes 20h to get
      check: () => {
        return this.services.mainLoopService.bankedTicks > 2 * 60 * 60 * 40; //there are 40 ticks a second
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['bankedTicksEfficiencyManual']);
      },
      unlocked: false
    },
    {
      name: "Breaks are Bad",
      description: "You died from overwork performing an activity without necessary rest and unlocked the " + this.services.itemRepoService.items['autoRestManual'].name,
      hint: "There's no time to rest, cultivating is life.",
      check: () => {
        return this.services.activityService.activityDeath || this.services.characterService.characterState.immortal;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['autoRestManual']);
      },
      unlocked: false
    },
    {
      name: "Still Spry",
      description: "You have lived to be 300 years old and unlocked the " + this.services.itemRepoService.items['ageSpeedManual'].name,
      hint: "One step to becoming immortal is to live longer.",
      check: () => {
        return this.services.characterService.characterState.age > 300 * 365;
      },
      effect: () => {
        this.services.storeService.unlockManual(this.services.itemRepoService.items['ageSpeedManual']);
      },
      unlocked: false
    },
    {
      name: "Immortality",
      description: "Congratulations! You are now immortal.",
      hint: "Name of the game.",
      check: () => {
        return this.services.characterService.characterState.immortal;
      },
      effect: () => { 
        this.services.activityService.reloadActivities();
      },
      unlocked: false
    },
    {
      name: "Headhunter",
      description: "You've sorted through so many applicants that you can now always find followers you want.",
      hint: "You didn't really want one thousand scouts, did you?",
      check: () => {
        return this.services.followerService.totalDismissed > 888;
      },
      effect: () => { 
        this.services.followerService.onlyWantedFollowers = true;
      },
      unlocked: false
    },
    {
      name: "Yes We Can!",
      description: "You found him.",
      hint: "Can we fix it?",
      check: () => {
        for (const follower of this.services.followerService.followers){
          if ((follower.name === "Robert" || follower.name === "Bob") && follower.job === "builder"){
            return true;
          }
        }
        return false;
      },
      effect: () => { 
        // no effect, it's just for fun
      },
      unlocked: false
    },
    {
      name: "Don't mess with Grandma",
      description: "You have crafted the mightiest stick. Grandmother would be so proud.",
      hint: "The best stick.",
      check: () => {
        if (this.services.characterService.characterState.equipment.leftHand?.name === "Grandmother's Walking Stick"){
          if ((this.services.characterService.characterState.equipment.leftHand.weaponStats?.baseDamage || 0) > 1e9){
            return true;
          }
        }
        return false;
      },
      effect: () => { 
        // no effect, it's just for fun
      },
      unlocked: false
    },
    
  ];
}

  unlockAchievement(achievement: Achievement, newAchievement: boolean) {
    if (newAchievement) {
      this.unlockedAchievements.push(achievement.name);
      this.services.logService.addLogMessage(achievement.description, 'STANDARD', 'STORY');
      this.services.gameStateService.savetoLocalStorage();
      this.services.characterService.toast('Achievement Unlocked: ' + (achievement.displayName ? achievement.displayName : achievement.name));
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
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.name)) {
        this.unlockAchievement(achievement, false);
      }
    }
  }

}

import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { Activity, ActivityType } from './activity';
import { FollowersService } from './followers.service';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';

export enum HellLevel {
  TongueRipping,
  Scissors,
  TreesOfKnives,
  Mirrors,
  Steamers,
  CopperPillars,
  MountainOfKnives,
  MountainOfIce,
  CauldronsOfOil,
  CattlePit,
  CrushingBoulder,
  MortarsAndPestles,
  BloodPool,
  WrongfulDead,
  Dismemberment,
  MountainOfFire,
  Mills,
  Saws
}

export interface Hell {
  name: string,
  description: string,
  index: number,
  entryEffect?: () => void;
  dailyEffect?: () => void;
  exitEffect?: () => void;
  completeEffect: () => void;
  activities: (Activity | undefined)[],
  projectionActivities: (Activity | undefined)[]
  hint: string,
  successCheck: () => boolean
}

export interface HellProperties {
  inHell: boolean,
  currentHell: number,
  completedHellTasks: number[],
  completedHellBosses: number[]
}

@Injectable({
  providedIn: 'root'
})
export class HellService {

  inHell = false;
  currentHell = -1;
  completedHellTasks: number[] = [];
  completedHellBosses: number[] = [];
  beaten = false;

  burnMoney = {
    level: 0,
    name: ['Burn Money'],
    activityType: ActivityType.BurnMoney,
    description: ['Burn mortal realm money to receive hell money.'],
    consequenceDescription: ['Uses a huge pile of mortal money (one million). Gives you 1 hell money.'],
    consequence: [() => {
      if (this.characterService.characterState.money < 1e6){
        return;
      }
      this.characterService.characterState.money -= 1e6;
      this.characterService.characterState.hellMoney++;
    }],
    resourceUse: [{
      stamina: 10
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  hellRecruiting = {
    level: 0,
    name: ['Recruiting the Damned'],
    activityType: ActivityType.HellRecruiting,
    description: ['Look for followers willing to help you.'],
    consequenceDescription: ['Uses 100 Stamina and 1000 hell money. Gives you a small chance of finding a follower.'],
    consequence: [() => {
      if (this.characterService.characterState.hellMoney < 1000){
        this.logService.addLogMessage("You don't have enough hell money. The damned souls around you team up with the demons to give you a beating.", "INJURY", "EVENT");
        this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
        if (this.characterService.characterState.status.health.value <= 0){
          this.beaten = true;
        }
        return;
      }
      this.characterService.characterState.status.stamina.value -= 100;
      this.characterService.characterState.hellMoney -= 1000;
      if (Math.random() < 0.01){
        this.followerService.generateFollower("damned");
        this.logService.addLogMessage("Your recruiting efforts seem to infuriate the demons here.", "STANDARD", "EVENT");
      }
    }],
    resourceUse: [{
      stamina: 100
    }],
    requirements: [{
      charisma: 1e6,
    }],
    unlocked: false,
    skipApprenticeshipLevel: 0
  }  

  honorAncestors = {
    level: 0,
    name: ['Honor Ancestors'],
    activityType: ActivityType.HonorAncestors,
    description: ['You look around and realize that you have many family members and ancestors here. You should probably give them some credit for what they have done for you. And some money.'],
    consequenceDescription: ['Uses 1 hell money.'],
    consequence: [() => {
      if (this.characterService.characterState.hellMoney < 1){
        return;
      }
      this.characterService.characterState.hellMoney--;
      this.inventoryService.addItem(this.itemRepoService.items['tokenOfGratitude']);
    }],
    resourceUse: [{
      stamina: 10
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private activityService: ActivityService,
    private followerService: FollowersService,
    private battleService: BattleService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService
  ) {

    mainLoopService.tickSubject.subscribe(() => {
      if (this.currentHell < 0){
        // not currently in a hell, bail out
        return;
      }
      const hell = this.hells[this.currentHell];
      if (hell.dailyEffect){
        hell.dailyEffect();
      }
      if (this.beaten){
        this.beaten = false;
        this.logService.addLogMessage("You fall to your knees, unable to bear more damage. You crawl back through this hell's gate to get a moment of respite at the gates of Lord Yama's realm.", "INJURY", "EVENT");
        if (hell.exitEffect){
          hell.exitEffect();
        }
        this.currentHell = -1;
        this.activityService.reloadActivities();
      }
      if (!this.completedHellTasks.includes(this.currentHell) && hell.successCheck()){
        hell.completeEffect();
        this.completedHellTasks.push(this.currentHell);
          
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  reset(){
    // reincarnation gets you out and back to the mortal realm
    if (this.inHell){
      if (this.currentHell > 0){
        const leavingHell = this.hells[this.currentHell];
        if (leavingHell.exitEffect){
          leavingHell.exitEffect();
        }
      }
      this.inHell = false;
      this.currentHell = -1;
      this.activityService.reloadActivities();
    }
  }

  trouble(){
    // TODO: tune all of these values
    if (this.currentHell === HellLevel.TongueRipping){
      let extraPower = 0;
      for (const follower of this.followerService.followers){
        extraPower += follower.power;
      }
      // monsters get stronger the more you've recruited/trained
      // tinker with stats/growth
      this.battleService.addEnemy({
        name: "Tongue Ripper",
        health: 1e20 + (1e19 * extraPower),
        maxHealth: 1e20 + (1e19 * extraPower),
        accuracy: 0.50,
        attack: 1e6 + (1e4 * extraPower),
        defense: 1e8 + (1e7 * extraPower),        
        loot: [ this.inventoryService.generateSpiritGem(Math.floor(Math.log2(extraPower + 2)), "corrupted") ]
      });      
    } else if (this.currentHell === HellLevel.Scissors){
      const extraPower = this.inventoryService.getQuantityByName("fingers");
      this.battleService.addEnemy({
        name: "Scissors Demon",
        health: 1e15 + (1e14 * extraPower),
        maxHealth: 1e15 + (1e14 * extraPower),
        accuracy: 0.50,
        attack: 1e6 + (1e4 * extraPower),
        defense: 1e8 + (1e7 * extraPower),        
        loot: [ this.inventoryService.generateSpiritGem(Math.floor(Math.log2(extraPower + 2)), "corrupted"), this.itemRepoService.items['fingers'] ]
      });
    } else if (this.currentHell === HellLevel.TreesOfKnives){
      this.battleService.addEnemy({
        name: "Hungry Crow",
        health: 1e6,
        maxHealth: 1e6,
        accuracy: 1,
        attack: 1e6,
        defense: 1e6,
        loot: [ ]
      });
    } else if (this.currentHell === HellLevel.Mirrors){
      this.battleService.addEnemy({
        name: "Your Reflection",
        health: this.characterService.characterState.status.health.value,
        maxHealth: this.characterService.characterState.status.health.value,
        accuracy: this.characterService.characterState.accuracy,
        attack: this.characterService.characterState.attackPower,
        defense: this.characterService.characterState.defense,
        loot: [ this.itemRepoService.items['mirrorShard'] ]
      });
    }
  }

  fightHellBoss(){
    if (this.currentHell == HellLevel.TongueRipping){
      this.battleService.addEnemy({
        name: "Gorbolash the Gossip Gasher",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,        
        loot: [ this.itemRepoService.items['hellCrownTongueRippers'] ]
      });
    } else if (this.currentHell == HellLevel.Scissors){
      this.battleService.addEnemy({
        name: "Malgorath the Marriage Masher",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownScissors'] ]
      });
    } else if (this.currentHell == HellLevel.TreesOfKnives){
      this.battleService.addEnemy({
        name: "Flamgolus the Family Flayer",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownTreesOfKnives'] ]
      });
    } else if (this.currentHell == HellLevel.Mirrors){
      this.battleService.addEnemy({
        name: "Myorshuggath the Mirror Master",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownMirrors'] ]
      });
    } else {
      this.battleService.addEnemy({
        name: "Boss Of A Generic Level",
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,        
        loot: [  ]
      });
    }
  }

  getProperties(): HellProperties {
    return {
      inHell: this.inHell,
      currentHell: this.currentHell,
      completedHellTasks: this.completedHellTasks,
      completedHellBosses: this.completedHellBosses,
    }
  }

  setProperties(properties: HellProperties) {
    this.inHell = properties.inHell || false;
    this.currentHell = properties.currentHell ?? -1;
    this.completedHellTasks = properties.completedHellTasks || [];
    this.completedHellBosses = properties.completedHellBosses || [];
    this.activityService.reloadActivities();
  }

  getActivityList(){
    const newList: Activity[] = [];
    if (this.currentHell === -1){
      // between hells now, choose which one to enter
      this.activityService.activityHeader = "Choose your Hell";
      this.activityService.activityHeaderDescription = "The heavens have cast you down to the depths of hell. You'll need to defeat every level to escape.";
      this.setEnterHellsArray(newList);
    } else {
      this.activityService.activityHeader = this.hells[this.currentHell].name;
      this.activityService.activityHeaderDescription = this.hells[this.currentHell].description;
      const hell = this.hells[this.currentHell];
      for (const activity of hell.activities){
        if (activity){
          activity.projectionOnly = false;
          newList.push(activity);
        }
      }
      for (const activity of hell.projectionActivities){
        if (activity){
          activity.projectionOnly = true;
          newList.push(activity);
        }
      }
      newList.push(this.flee());
    }

    return newList;
  }

  flee(): Activity{
    return {
      level: 0,
      name: ["Escape from this hell"],
      activityType: ActivityType.EscapeHell,
      description: ["Return to the gates of Lord Yama's realm."],
      consequenceDescription: [""],
      consequence: [() => {
        this.characterService.characterState.hellMoney = 0;
        this.battleService.enemies = [];
        this.battleService.currentEnemy = null;
        const leavingHell = this.hells[this.currentHell];
        if (leavingHell.exitEffect){
          leavingHell.exitEffect();
        }
        this.currentHell = -1;
        this.activityService.reloadActivities();
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }
  }

  setEnterHellsArray(newList: Activity[]) {
    newList.push(this.activityService.Resting);
    newList.push(this.activityService.CombatTraining);
    newList.push(this.activityService.SoulCultivation);
    for (const hell of this.hells){
      let consequenceDescription = "";
      if (this.completedHellBosses.includes(hell.index)){
        consequenceDescription = "You have proven your mastery over this hell."
      } else if (this.completedHellTasks.includes(hell.index)){
        consequenceDescription = "The Lord of this Hell is available to challenge."
      }
      newList.push({
          level: 0,
          name: ["Enter the " + hell.name],
          activityType: ActivityType.Hell + hell.index,
          description: [hell.description],
          consequenceDescription: [consequenceDescription],
          consequence: [() => {
            this.characterService.characterState.hellMoney = 0;
            this.currentHell = hell.index;
            const newHell = this.hells[hell.index];
            if (newHell.entryEffect){
              newHell.entryEffect();
            }
            this.activityService.reloadActivities();
          }],
          requirements: [{
          }],
          unlocked: true,
          skipApprenticeshipLevel: 0
      })
    }
  }

  hells: Hell[] = [
    {
      name: "Hell of Tongue-ripping",
      description: "Torment for gossips and everyone one who made trouble with their words. The demons here reach for your tongue to rip it out.",
      index: HellLevel.TongueRipping,
      entryEffect: () => {
        this.followerService.stashFollowers();
      },
      dailyEffect: () => {
        // This might be a stupid way to nerf charisma. Consider other alternatives.
        let totalPower = 1;
        let reducer = .9;
        this.characterService.characterState.attributes.charisma.value *= reducer;
      },
      exitEffect: () => {
        this.followerService.restoreFollowers();
      },
      completeEffect: () => {
        this.logService.addLogMessage("Together with your new followers, you have seized control of the Hell of Tongue-ripping. Now all that remains is to defeat its lord.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.hellRecruiting, this.activityService.TrainingFollowers],
      projectionActivities: [this.burnMoney],
      hint: "It's hard to talk with all these demons going for your mouth, but maybe if you can get some help from the other prisoners here you could take control of this place.",
      successCheck: () => {
        let totalPower = 0;
        for (const follower of this.followerService.followers){
          totalPower += follower.power;
        }
        return totalPower > 5000;
      }
    },
    {
      name: "Hell of Scissors",
      description: "Torment for those who ruin marriages. The demons here will cut your fingers right off.",
      index: HellLevel.Scissors,
      entryEffect: () => {
        this.characterService.stashWeapons();
      },
      exitEffect: () => {
        this.characterService.restoreWeapons();
      },
      completeEffect: () => {
        this.logService.addLogMessage("Using nothing but the strength of your body and mind, you have seized control of the Hell of Scissors. Now all that remains is to defeat its lord.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.activityService.Taunting],
      projectionActivities: [this.burnMoney],
      hint: "These demons don't seem content to just take your fingers. You'd better get ready to defend yourself.",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("fingers") >= 100;
      }
    },
    {
      name: "Hell of Trees of Knives",
      description: "Torment for those who cause trouble between family members. The demons here will tie you to a tree made of sharp knives",
      index: HellLevel.TreesOfKnives,
      entryEffect: () => {
        this.characterService.stashMoney();
      },
      dailyEffect: () => {
        // lose 10% of your health every day
        this.characterService.characterState.status.health.value -= (this.characterService.characterState.status.health.value * 0.1);
      },
      exitEffect: () => {
        this.characterService.restoreMoney();
      },
      completeEffect: () => {
        this.logService.addLogMessage("You have reconciled yourself with all of your family members and satisfied the demands of this hell. Now all that remains is to defeat its lord (while still tied to this tree).", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.honorAncestors],
      projectionActivities: [this.burnMoney, this.activityService.OddJobs],
      hint: "Heal your family bonds.",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("token of gratitude") >= 10000;
      }
    },
    {
      name: "Hell of Mirrors",
      description: "Torment for those who escaped punishment for their crimes. The mirrors here shine with a terrifying glow.",
      index: HellLevel.Mirrors,
      entryEffect: () => {
        this.followerService.stashFollowers();
      },
      exitEffect: () => {
        this.followerService.restoreFollowers();
      },
      completeEffect: () => {
        this.inventoryService.consume("mirrorShard", 1000);
        this.logService.addLogMessage("You piece together the shards of mirror that you have collected to form a new mirror. A dark shape looms beyond it.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.CombatTraining, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.activityService.Taunting],
      projectionActivities: [],
      hint: "Master yourself. All by yourself.",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("mirror shard") >= 1000;
      }
    },
    {
      name: "Hell of Steamers",
      description: "Torment for hypocrites and troublemakers. The steam baskets here are just the right size for you.",
      index: HellLevel.Steamers,
      entryEffect: () => {
        /*
        Task: Rehabilitate some troublemakers
        During the level: Constantly robbed and beaten by troublemakers
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of Copper Pillars",
      description: "Torment for arsonists. The red-hot copper pillars remind you of all those times you played with fire.",
      index: HellLevel.CopperPillars,
      entryEffect: () => {
        /*
        Task: Forge special hammers to break the chains
        During the level: Blacksmithing/mining/smelting nerfed to only allow copper
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of the Mountain of Knives",
      description: "Torment for those who killed for pleasure. The mountain of sharp blades looks like it might be rough on footwear.",
      index: HellLevel.MountainOfKnives,
      entryEffect: () => {
        /*
        Task: climb the mountain, taking damage at every step
        During the level: Increase damage taken based on total kills that life
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of the Mountain of Ice",
      description: "Torment for adulterers and schemers. The chill wind blowing through the gate is so cold it burns.",
      index: HellLevel.MountainOfIce,
      entryEffect: () => {
        /*
        Task: melt the mountain with fire magic
        During the level: Fire lore nerfed, fire lore activities (including blacksmithing) unavailable
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {

      name: "Hell of the Cauldrons of Oil",
      description: "Torment for rapists and abusers. Next on the menu: deep fried immortal.",
      index: HellLevel.CauldronsOfOil,
      entryEffect: () => {
        /*
        Task: Drain the oil, escape the cauldon, then refill the oil
        During the level: Slippery hands - accuracy reduced, weapon falls back into inventory
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {

      name: "Hell of the Cattle Pit",
      description: "Torment for animal abusers. The cows are looking a little restless.",
      index: HellLevel.CattlePit,
      entryEffect: () => {
        /*
        Task: Heal animals
        During the level: Extra tough mad cow monsters, lots of them
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of the Crushing Boulder",
      description: "Torment for child-killer and abondoners. Atlas had it easy compared to these things.",
      index: HellLevel.CrushingBoulder,
      entryEffect: () => {
        /*
        Task: Roll a boulder (strength check)
        During the level:only magical attacks are usable (your hands are busy with the boulder)
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of Mortars and Pestles",
      description: "Torment for food wasters. You didn't really need to eat all those peaches, did you? The diet here is pure hellfire.",
      index: HellLevel.MortarsAndPestles,
      entryEffect: () => {
        /*
      Task: Fast a long time
      During the level: using, selling, or throwing away food resets the timer
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of the Blood Pool",
      description: "Torment for those who disrespect others. The pool looks deep, but it's hard to tell with all that blood.",
      index: HellLevel.BloodPool,
      entryEffect: () => {
        /*
        Task: Swim to the bottom of the pool, break through to drain it
        During the level: Underwater, most activities unavailable
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of the Wrongful Dead",
      description: "Torment for those who gave up their lives too early. Fortunately you've probably never done that. The pounding Rains of Pain and the blowing Winds of Sorrow give unrelenting misery to everyone here.",
      index: HellLevel.WrongfulDead,
      entryEffect: () => {
        /*
        Task: Find the escape (intelligence check), teach everyone the exit (charisma check)
        During the level: Frequent random damage from winds and rain
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of Dismemberment",
      description: "Torment for tomb-raiders and grave-robbers. The demons here look awfully handy with those giant axes.",
      index: HellLevel.Dismemberment,
      entryEffect: () => {
        /*
        Task: Raid the tomb (speed check), put the treasures back (money)
        During the level: Traps
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {

      name: "Hell of the Mountain of Fire",
      description: "Torment for thieves. The volcano where the poor souls are thrown looks a little toasty for comfort.",
      index: HellLevel.MountainOfFire,
      entryEffect: () => {
        /*
        Task: Plug the volcano, ride the explosion out
        During the level: no water-based activities
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {

      name: "Hell of Mills",
      description: "Torment for any who abused their power to oppress the weak. You don't look forward to being ground into immortal flour.",
      index: HellLevel.Mills,
      entryEffect: () => {
        /*
        Task: Endure the mill (toughness check)
        During the level: Constant heavy damage
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    },
    {
      name: "Hell of Saws",
      description: "Torment for swindlers and business cheats. The demons sharpen their saws and grin at you. You wish now that you'd stayed out of politics.",
      index: 0,
      entryEffect: () => {
        /*
        Task: Find the final loophole (charisma and intelligence check)
        During the level: Extra tough enemies
        */
      },
      completeEffect: () => {
        this.logService.addLogMessage("You win!.", "STANDARD", "STORY")
      },
      activities: [],
      projectionActivities: [],
      hint: "",
      successCheck: () => {
        return false;
      }
    }
  ]


}

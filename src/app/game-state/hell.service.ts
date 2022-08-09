import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { Activity, ActivityType } from './activity';
import { FollowersService } from './followers.service';
import { Equipment, InventoryService } from './inventory.service';
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
  completedHellBosses: number[],
  mountainSteps: number
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
  mountainSteps = 0;

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

  rehabilitation = {
    level: 0,
    name: ['Rehabilitate Troublemakers'],
    activityType: ActivityType.Rehabilitation,
    description: ['You recognize a bunch of the troublemakers here as people who used to beat and rob you in your past lives. Perhaps you can give them some some friendly rehabilitation. With your fists.'],
    consequenceDescription: ['Uses 100 Stamina and 10 hell money as bait. Breaks a troublemaker out of their basket and picks a fight with them.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 100;
      this.battleService.addEnemy({
        name: "Troublemaker",
        health: 100,
        maxHealth: 100,
        accuracy: 0.50,
        attack: 10,
        defense: 10,
        defeatEffect: "respawnDouble",
        loot: [ ]
      });
    }],
    resourceUse: [{
      stamina: 100
    }],
    requirements: [{
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

  copperMining = {
    level: 0,
    name: ['Copper Mining'],
    activityType: ActivityType.CopperMining,
    description: ["The copper pillars here look like they're made of a decent grade of copper. It looks like you have enough slack in your chains to turn and break off some pieces."],
    consequenceDescription: ['Costs 100,000 stamina and produces one copper bar.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 100000;
      this.inventoryService.addItem(this.itemRepoService.items['copperBar']);
    }],
    resourceUse: [{
      stamina: 100000
    }],
    requirements: [{
      strength: 1e24
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  forgeHammer = {
    level: 0,
    name: ['Forge Hammer'],
    activityType: ActivityType.ForgeHammer,
    description: ["Shape a bar of copper into a hammer using your bare hands. This would be so much easier with an anvil and tools."],
    consequenceDescription: ['Costs 100,000 stamina and produces the worst hammer in the world.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 100000;
      if (this.inventoryService.consume("metal", 1) > 0){
        const newHammer: Equipment = {
          id: 'weapon',
          name: "Copper Hammer",
          type: "equipment",
          slot: "rightHand",
          value: 1,
          weaponStats: {
            baseDamage: 1,
            material: "metal",
            durability: 1,
            baseName: "hammer"
          },
          description: 'A crude copper hammer.'
        };
        this.inventoryService.addItem(newHammer);
      }
    }],
    resourceUse: [{
      stamina: 100000
    }],
    requirements: [{
      strength: 1e24
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  climbMountain = {
    level: 0,
    name: ['Climb the Mountain'],
    activityType: ActivityType.ClimbMountain,
    description: ["Take another step up the mountain. The path before you seems exceptionally jagged. Maybe you shouldn't have killed so very many little spiders."],
    consequenceDescription: ['Costs 1000 stamina and produces the worst hammer in the world.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 1000;
      this.mountainSteps++;
    }],
    resourceUse: [{
      stamina: 1000
    }],
    requirements: [{
      strength: 1e24,
      toughness: 1e24
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  attackClimbers = {
    level: 0,
    name: ['Attack Climbers'],
    activityType: ActivityType.AttackClimbers,
    description: ["The murderers on this mountain look pretty distracted. It wouldn't be hard to knock them down to the bottom."],
    consequenceDescription: ['Knock a climber off the mountain.'],
    consequence: [() => {
      this.mountainSteps = 0;
    }],
    resourceUse: [{
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  meltMountain = {
    level: 0,
    name: ['Melt the Mountain'],
    activityType: ActivityType.MeltMountain,
    description: ["The mountain is far to slippery climb. The only way you're getting to the top is to bring the top down to you."],
    consequenceDescription: ['Focus your connection to fire and melt that sucker down.'],
    consequence: [() => {
      let numberSpawned = Math.log10(this.characterService.characterState.attributes.fireLore.value);
      for (let i = 0; i < numberSpawned; i++){
        this.battleService.addEnemy({
          name: "Ice Golem",
          health: 1e15,
          maxHealth: 1e15,
          accuracy: 0.7,
          attack: 1e6,
          defense: 1e6,
          loot: [ this.itemRepoService.items['iceCore'] ]
        });
      }
    }],
    resourceUse: [{
    }],
    requirements: [{
      fireLore: 1000 // TODO: tune this
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
    if (this.currentHell === HellLevel.TongueRipping){
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
    } else if (this.currentHell === HellLevel.Scissors){
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
    } else if (this.currentHell === HellLevel.TreesOfKnives){
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
    } else if (this.currentHell === HellLevel.Mirrors){
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
    } else if (this.currentHell === HellLevel.Steamers){
      this.battleService.addEnemy({
        name: "Stactolus the Steamer",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownSteamers'] ]
      });
    } else if (this.currentHell === HellLevel.CopperPillars){
      this.battleService.addEnemy({
        name: "Ignificor the Forever Burning",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownPillars'] ]
      });
    } else if (this.currentHell === HellLevel.MountainOfKnives){
      this.battleService.addEnemy({
        name: "Malignus the Murderer Muncher",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownMountainOfKnives'] ]
      });
    } else if (this.currentHell === HellLevel.MountainOfIce){
      this.battleService.addEnemy({
        name: "The Cheat",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownMountainOfIce'] ]
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
      mountainSteps: this.mountainSteps
    }
  }

  setProperties(properties: HellProperties) {
    this.inHell = properties.inHell || false;
    this.currentHell = properties.currentHell ?? -1;
    this.completedHellTasks = properties.completedHellTasks || [];
    this.completedHellBosses = properties.completedHellBosses || [];
    this.mountainSteps = properties.mountainSteps || 0;
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
        const reducer = .9;
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
        this.characterService.stashWeapons();
        this.characterService.stashArmor();
      },
      exitEffect: () => {
        this.characterService.restoreWeapons();
        this.characterService.restoreArmor();
      },
      dailyEffect: () => {
        // take damage from the steam and get robbed by troublemakers
        if (this.inventoryService.consume("iceCore") < 0){
          this.characterService.characterState.status.health.value -= (this.characterService.characterState.status.health.value * 0.05);
        }
        if (Math.random() < 0.2){
          this.logService.addLogMessage("As if the constant scalding steam isn't enough, one of these troublemakers stole some money! Why does this feel so familiar?", "STANDARD", "EVENT")
          this.characterService.characterState.hellMoney -= this.characterService.characterState.hellMoney * 0.1;
        }
      },
      completeEffect: () => {
        this.battleService.clearEnemies();
        this.logService.addLogMessage("You defeat so many troublemakers that the rest all beg to return to their baskets for their regular torment.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.rehabilitation],
      projectionActivities: [this.burnMoney],
      hint: "There so many troublemakers here that deserve some payback from you. I wonder if you can take them all on.",
      successCheck: () => {
        let totalEnemies = 0;
        for (const enemyStack of this.battleService.enemies){
          totalEnemies += enemyStack.quantity;
        }
        return totalEnemies > 100; // tune this
      }
    },
    {
      name: "Hell of Copper Pillars",
      description: "Torment for arsonists. The red-hot copper pillars you will be bound to remind you of all those times you played with fire.",
      index: HellLevel.CopperPillars,
      entryEffect: () => {
        this.characterService.stashWeapons();
      },
      exitEffect: () => {
        this.characterService.restoreWeapons();
      },
      dailyEffect: () => {
        // take damage from the pillar
        if (this.inventoryService.consume("iceCore") < 0){
          this.characterService.characterState.status.health.value -= Math.max(this.characterService.characterState.status.health.value * 0.1, 20);
        }
      },
      completeEffect: () => {
        this.logService.addLogMessage("You finally forge a hammer powerful enough to break through the chains that bind you to the pillar. The Lord of this Hell comes to investigate all the commotion as the chains fall to the ground.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.copperMining, this.forgeHammer ],
      projectionActivities: [],
      hint: "You'll need a really strong hammer to break through these hellsteel chain. Too bad the only material around is copper.",
      successCheck: () => {
        return ((this.characterService.characterState.equipment.rightHand?.weaponStats?.baseDamage || 0)  > 100); // tune this
      }
    },
    {
      name: "Hell of the Mountain of Knives",
      description: "Torment for those who killed for pleasure. The mountain of sharp blades looks like it might be rough on footwear.",
      index: HellLevel.MountainOfKnives,
      dailyEffect: () => {
        // TODO: tune this
        let damage = (this.battleService.totalKills / 10) - (this.mountainSteps * 10);
        if (damage < 0){
          damage = 0;
        }
        this.characterService.characterState.status.health.value -= damage;
        if (damage > 0){
          this.logService.addLogMessage("The mountain's blades shred you for " + damage + " damage.", "INJURY", "COMBAT");
        }
      },
      completeEffect: () => {
        this.logService.addLogMessage("You finally reach the peak. The karmic weight of all the killing you've ever done drops from your shoulders. Now to defeat this hell's lord without taking any pleasure in the act.", "STANDARD", "STORY");
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.climbMountain],
      projectionActivities: [],
      hint: "It seems you've accrued a lot of karma from all the killing you've done over your many lives. The bill is due.",
      successCheck: () => {
        // let's just say that 90% of our kills were justified and we didn't enjoy them one bit. Still gotta pay for the other 10%.
        return this.mountainSteps >= this.battleService.totalKills / 10;
      }
    },
    {
      name: "Hell of the Mountain of Ice",
      description: "Torment for adulterers and schemers. The chill wind blowing through the gate is so cold it burns.",
      index: HellLevel.MountainOfIce,
      completeEffect: () => {
        this.logService.addLogMessage("You realize that the power of the ice cores is all that prevents the heat from the neighboring hells from turning the mountain into slush. With enough of these tucked away in your pack, the mountain dwindles down to a managable size. Now to see who's in charge around here.", "STANDARD", "STORY");
      },
      dailyEffect: () => {
        // TODO: tune this
        let damage = 1000;
        this.characterService.characterState.status.health.value -= damage;
        this.logService.addLogMessage("The mountain's ice freezes you for " + damage + " damage.", "INJURY", "COMBAT");
        // This might be a stupid way to nerf fireLore. Consider other alternatives.
        const reducer = .9;
        this.characterService.characterState.attributes.fireLore.value *= reducer;
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.meltMountain],
      projectionActivities: [],
      hint: "Burn it down!",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("ice core") >= 10000; // TODO: tune this
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

import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { Activity, ActivityType } from './activity';
import { FollowersService } from './followers.service';
import { Equipment, InventoryService, Item } from './inventory.service';
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
  mountainSteps: number,
  animalsHealed: number,
  boulderHeight: number,
  daysFasted: number,
  swimDepth: number,
  exitFound: boolean,
  soulsEscaped: number,
  relicsReturned: number
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
  animalsHealed = 0;
  boulderHeight = 0;
  daysFasted = 0;
  swimDepth = 0;
  exitFound = false;
  soulsEscaped = 0;
  relicsReturned = 0;

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
        this.followerService.generateFollower(false, "damned");
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
    consequenceDescription: ['Uses 100,000 stamina and produces one copper bar.'],
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
    consequenceDescription: ['Uses 100,000 stamina and produces the worst hammer in the world.'],
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
    consequenceDescription: ['Uses 1000 stamina and produces the worst hammer in the world.'],
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
      const numberSpawned = Math.log10(this.characterService.characterState.attributes.fireLore.value);
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

  healAnimals = {
    level: 0,
    name: ['Heal Animals'],
    activityType: ActivityType.HealAnimals,
    description: ["You notice that not all the animals here are frenzied killers. Some of them are sick, wounded, and miserable. You resolve to do what good you can here."],
    consequenceDescription: ['Uses 10,000 mana and 10,000 stamina. Heals an animal.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 10000;
      this.characterService.characterState.status.mana.value -= 10000;
      this.animalsHealed++;
    }],
    resourceUse: [{
      stamina: 10000,
      mana: 10000
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  liftBoulder = {
    level: 0,
    name: ['Lift the Boulder Higher'],
    activityType: ActivityType.LiftBoulder,
    description: ["The boulder is heavy, but you are strong. See how high you can lift it."],
    consequenceDescription: ['Uses 100,000 stamina. Heals an animal.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 100000;
      this.boulderHeight++;
    }],
    resourceUse: [{
      stamina: 10000,
      mana: 10000
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  swim = {
    level: 0,
    name: ['Swim Deeper into the Blood'],
    activityType: ActivityType.Swim,
    description: ['Swim down further into the crimson depths.'],
    consequenceDescription: ['Uses 2000 Stamina. Reduce health by 1000.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 2000;
      this.characterService.characterState.status.health.value -= 1000;
      this.swimDepth++;
    }],
    resourceUse: [{
      stamina: 2000,
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  searchForExit = {
    level: 0,
    name: ['Search for the Exit'],
    activityType: ActivityType.SearchForExit,
    description: ["The lost souls here are searching for a way out, and they can't seem to see the portal you came in on. You could help them search for the exit they're seeking."],
    consequenceDescription: ['Uses 200,000 Stamina.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 200000;
      // TODO: tune this
      if (this.characterService.characterState.attributes.intelligence.value <= 1e24){
        return;
      }
      const threshold = (Math.log10(this.characterService.characterState.attributes.intelligence.value - 1e24) * 0.000001);
      if (Math.random() < threshold) {
        this.exitFound = true;
        if (!this.hells[HellLevel.WrongfulDead].activities.includes(this.teachTheWay)){
          this.hells[HellLevel.WrongfulDead].activities.push(this.teachTheWay);
          this.activityService.reloadActivities();
        }
      }
      this.characterService.characterState.status.stamina.value -= 200000;
    }],
    resourceUse: [{
      stamina: 200000,
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  teachTheWay = {
    level: 0,
    name: ['Teach the Way to the Exit'],
    activityType: ActivityType.TeachTheWay,
    description: ["Teach the other damned souls here the way out."],
    consequenceDescription: ['Uses 200,000 Stamina.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 200000;
      // TODO: tune this
      if (this.characterService.characterState.attributes.charisma.value <= 1e24){
        return;
      }
      const numberTaught = Math.floor(Math.log10(this.characterService.characterState.attributes.charisma.value - 1e24));
      this.soulsEscaped += numberTaught;
    }],
    resourceUse: [{
      stamina: 200000,
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  interrogate = {
    level: 0,
    name: ['Interrogate the Damned'],
    activityType: ActivityType.Interrogate,
    description: ["Find out where the thieves here hid their stolen treasures. You might be able to reverse some of the damage they have done."],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 1000;
      if (this.characterService.characterState.attributes.charisma.value <= 1e24){
        return;
      }
      const threshold = (Math.log10(this.characterService.characterState.attributes.charisma.value - 1e24) * 0.000001);
      if (Math.random() < threshold) {
        this.inventoryService.addItem(this.itemRepoService.items["treasureMap"]);
      }
    }],
    resourceUse: [{
      stamina: 1000,
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  recoverTreasure = {
    level: 0,
    name: ['Recover a Treasure'],
    activityType: ActivityType.RecoverTreasure,
    description: ["Recover a stolen relic. You'll need all your wits to find it even if you have one the sketchy maps the damned can provide."],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 1000;
      if (this.characterService.characterState.attributes.intelligence.value <= 1e24){
        return;
      }
      const threshold = (Math.log10(this.characterService.characterState.attributes.intelligence.value - 1e24) * 0.000001);
      if (Math.random() < threshold) {
        if (this.inventoryService.consume("treasureMap") > 0){
          this.inventoryService.addItem(this.itemRepoService.items["stolenRelic"]);
        }
      }
    }],
    resourceUse: [{
      stamina: 1000,
    }],
    requirements: [{
    }],
    unlocked: true,
    skipApprenticeshipLevel: 0
  }

  replaceTreasure = {
    level: 0,
    name: ['Replace a Treasure'],
    activityType: ActivityType.ReplaceTreasure,
    description: ["Return a stolen relic to the tomb where it came from. You'll need to be quick to avoid the tomb's traps."],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [() => {
      this.characterService.characterState.status.stamina.value -= 1000;
      if (this.characterService.characterState.attributes.speed.value <= 1e24){
        return;
      }
      const threshold = (Math.log10(this.characterService.characterState.attributes.speed.value - 1e24) * 0.000001);
      if (Math.random() < threshold) {
        if (this.inventoryService.consume("stolenRelic") > 0){
          this.relicsReturned++;
        }
      }
    }],
    resourceUse: [{
      stamina: 1000,
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
        loot: [ this.inventoryService.generateSpiritGem(Math.floor(Math.log2(extraPower + 2)), "corruption") ]
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
        loot: [ this.inventoryService.generateSpiritGem(Math.floor(Math.log2(extraPower + 2)), "corruption"), this.itemRepoService.items['fingers'] ]
      });
    } else if (this.currentHell === HellLevel.TreesOfKnives){
      this.battleService.addEnemy({
        name: "Hungry Crow",
        health: 1e6,
        maxHealth: 1e6,
        accuracy: 1,
        attack: 1e6,
        defense: 1e6,
        loot: [ this.inventoryService.generateSpiritGem(25, "corruption") ]
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
    } else if (this.currentHell === HellLevel.CauldronsOfOil){
      this.battleService.addEnemy({
        name: "Oiled Demon",
        health: 1e6,
        maxHealth: 1e6,
        accuracy: 1,
        attack: 1e6,
        defense: 1e6,
        loot: [ this.inventoryService.generateSpiritGem(25, "corruption") ]
      });
    } else if (this.currentHell === HellLevel.CattlePit){
      if (this.animalsHealed <= 1000000){
        for (let i = 0; i < 10; i++){
          this.battleService.addEnemy({
            name: "Demonic Cow",
            health: 1e6,
            maxHealth: 1e6,
            accuracy: 1,
            attack: 1e6,
            defense: 1e6,
            loot: [ this.inventoryService.generateSpiritGem(25, "corruption") ]
          });
        }
      }
    } else if (this.currentHell === HellLevel.MortarsAndPestles){
      this.battleService.addEnemy({
        name: "Force Feeder",
        health: 1e6,
        maxHealth: 1e6,
        accuracy: 1,
        attack: 1e6,
        defense: 1e6,
        attackEffect: "feeder",
        hitTracker: 0,
        loot: [ this.inventoryService.generateSpiritGem(25, "corruption") ]
      });
    } else if (this.currentHell === HellLevel.Dismemberment){
      this.battleService.addEnemy({
        name: "Axe Demon",
        health: 1e6,
        maxHealth: 1e6,
        accuracy: 1,
        attack: 1e6,
        defense: 1e6,
        loot: [ this.inventoryService.generateSpiritGem(25, "corruption") ]
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
    } else if (this.currentHell === HellLevel.CauldronsOfOil){
      this.battleService.addEnemy({
        name: "Nestor the Molestor",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownCauldronsOfOil'] ]
      });
    } else if (this.currentHell === HellLevel.CattlePit){
      this.battleService.addEnemy({
        name: "The Cow Emperor",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownCattlePit'] ]
      });
    } else if (this.currentHell === HellLevel.CrushingBoulder){
      this.battleService.addEnemy({
        name: "The Crusher",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownCrushingBoulder'] ]
      });
    } else if (this.currentHell === HellLevel.MortarsAndPestles){
      this.battleService.addEnemy({
        name: "Glorbulskath the Gluttonous",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownMortarsAndPestles'] ]
      });
    } else if (this.currentHell === HellLevel.BloodPool){
      this.battleService.addEnemy({
        name: "Gnarlyathor the Ever-Bleeding",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownBloodPool'] ]
      });
    } else if (this.currentHell === HellLevel.WrongfulDead){
      this.battleService.addEnemy({
        name: "Azoth-Raketh the Storm Master",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownWrongfulDead'] ]
      });
    } else if (this.currentHell === HellLevel.Dismemberment){
      this.battleService.addEnemy({
        name: "Druskall the Dismemberer",
        // TODO: figure out stats
        health: 1,
        maxHealth: 1,
        accuracy: 0.8,
        attack: 1,
        defense: 1,
        loot: [ this.itemRepoService.items['hellCrownDismemberment'] ]
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
      mountainSteps: this.mountainSteps,
      animalsHealed: this.animalsHealed,
      boulderHeight: this.boulderHeight,
      daysFasted: this.daysFasted,
      swimDepth: this.swimDepth,
      exitFound: this.exitFound,
      soulsEscaped: this.soulsEscaped,
      relicsReturned: this.relicsReturned
    }
  }

  setProperties(properties: HellProperties) {
    this.inHell = properties.inHell || false;
    this.currentHell = properties.currentHell ?? -1;
    this.completedHellTasks = properties.completedHellTasks || [];
    this.completedHellBosses = properties.completedHellBosses || [];
    this.mountainSteps = properties.mountainSteps || 0;
    this.animalsHealed = properties.animalsHealed || 0;
    this.boulderHeight = properties.boulderHeight || 0;
    this.daysFasted = properties.daysFasted || 0;
    this.swimDepth = properties.swimDepth || 0;
    this.exitFound = properties.exitFound || false;
    this.soulsEscaped = properties.soulsEscaped || 0;
    this.relicsReturned = properties.relicsReturned || 0;
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
    newList.push(this.activityService.CoreCultivation);
    newList.push(this.activityService.SoulCultivation);
    newList.push(this.activityService.InfuseBody);
    if (this.activityService.purifyGemsUnlocked){
      newList.push(this.activityService.PurifyGems);
    }
    newList.push(this.activityService.InfuseEquipment);
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
        const damage = 1000;
        this.characterService.characterState.status.health.value -= damage;
        this.logService.addLogMessage("The mountain's ice freezes you for " + damage + " damage.", "INJURY", "COMBAT");
        // This might be a stupid way to nerf fireLore. Consider other alternatives.
        const reducer = .9;
        this.characterService.characterState.attributes.fireLore.value *= reducer;
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.meltMountain],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "Burn it down!",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("ice core") >= 10000; // TODO: tune this
      }
    },
    {
      name: "Hell of the Cauldrons of Oil",
      description: "Torment for rapists and abusers. Next on the menu: deep fried immortal.",
      index: HellLevel.CauldronsOfOil,
      dailyEffect: () => {
        if (!this.completedHellTasks.includes(HellLevel.CauldronsOfOil)){
          if (this.inventoryService.consume("iceCore") < 0){
            this.logService.addLogMessage("The ice cores you brought in with you make the oil sputter and pop, baking you in a cloud of superheated steam.", "INJURY", "EVENT");
            this.characterService.characterState.status.health.value -= 100000;
            return;
          }
          // take damage from the oil
          this.characterService.characterState.status.health.value -= Math.max(this.characterService.characterState.status.health.value * 0.1, 20);
        }
        // chance to drop weapon
        if (Math.random() < 0.1){
          this.logService.addLogMessage("Your weapons slip from your oily hands.", "INJURY", "COMBAT");
          this.inventoryService.autoequipBestEnabled = false;
          let item = this.characterService.characterState.equipment.rightHand;
          // check for existence and make sure there's an empty slot for it
          if (item){
            this.inventoryService.addItem(item as Item);
            this.characterService.characterState.equipment.rightHand = null;
          }
          item = this.characterService.characterState.equipment.leftHand;
          // check for existence and make sure there's an empty slot for it
          if (item){
            this.inventoryService.addItem(item as Item);
            this.characterService.characterState.equipment.leftHand = null;
          }
        }
      },
      completeEffect: () => {
        this.logService.addLogMessage("The pile of ice cores you brought in with you make the oil sputter and pop, but you are tough enough to withstand the superheated steam. Out of the cauldron now, you look around for the boss.", "STANDARD", "STORY");
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation,],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "You'd need to be incredibly resilient to survive this place.",
      successCheck: () => {
        return this.inventoryService.getQuantityByName("ice core") >= 1000 && this.characterService.characterState.status.health.value > 100000;
      }
    },
    {
      name: "Hell of the Cattle Pit",
      description: "Torment for animal abusers. The cows are looking a little restless.",
      index: HellLevel.CattlePit,
      completeEffect: () => {
        this.logService.addLogMessage("The horde of rampaging cattle finally seems to understand that you're not there to hurt them. They back off and leave you alone. All except for that really big cow over there.", "STANDARD", "STORY");
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.healAnimals],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "Look at those poor sick cows. And those other cows that for some reason are standing up on two legs and charging you with weapons.",
      successCheck: () => {
        return this.animalsHealed > 1000000;
      }
    },
    {
      name: "Hell of the Crushing Boulder",
      description: "Torment for child-killer and abondoners where the damned have to lift giant boulders or be crushed under them. Atlas had it easy compared to these people.",
      index: HellLevel.CrushingBoulder,
      dailyEffect: () => {
        if (this.boulderHeight > 100){
          return;
        }
        // TODO: tune this
        const damage = 500;
        this.characterService.characterState.status.health.value -= damage;
        this.logService.addLogMessage("The boulder crushes you for " + damage + " damage.", "INJURY", "COMBAT");
        if (Math.random() < 0.1){
          this.battleService.addEnemy({
            name: "An Annoying Imp",
            health: 10,
            maxHealth: 10,
            accuracy: 1,
            attack: 100,
            defense: 100,
            loot: [ ]
          });
        }
      },
      entryEffect: () => {
        this.boulderHeight = 0;
      },
      completeEffect: () => {
        this.logService.addLogMessage("You hoist the boulder high over your head, then throw it high into the air. It lands with a satisfying thud. Unfortunately, it grows arms and legs and walks back to you, and this time it looks angry.", "STANDARD", "STORY");
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.liftBoulder],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "It's leg day. No, it's arm day. Must be both! Lift!",
      successCheck: () => {
        return this.boulderHeight > 100;
      }
    },
    {
      name: "Hell of Mortars and Pestles",
      description: "Torment for food wasters. You didn't really need to eat all those peaches, did you? The diet here is pure hellfire.",
      index: HellLevel.MortarsAndPestles,
      dailyEffect: () => {
        this.daysFasted++;
      },
      completeEffect: () => {
        this.logService.addLogMessage("Your righteous asceticism have served you well. The lord of this hell has arrived to deal with you personally.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "You begin to feel remorse for your gluttony across your many lives. Perhaps a nice, long fast would help you feel better. Hopefully you can keep the demons from spoonfeeding you their fiery concoction.",
      successCheck: () => {
        return this.daysFasted > 1000;
      }
    },
    {
      name: "Hell of the Blood Pool",
      description: "Torment for those who disrespect others. The pool looks deep, but it's hard to tell with all that blood.",
      index: HellLevel.BloodPool,
      entryEffect: () => {
        this.swimDepth = 0;
      },
      completeEffect: () => {
        this.logService.addLogMessage("You finally reach the bottom of the pool where you find a massive plug. When you pull it, the pool begins to drain, revealing the source of all this blood.", "STANDARD", "STORY")
      },
      activities: [this.swim],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "Not this again!",
      successCheck: () => {
        return this.swimDepth > 1000;
      }
    },
    {
      name: "Hell of the Wrongful Dead",
      description: "Torment for those who gave up their lives too early. Fortunately you've probably never done that. The pounding Rains of Pain and the blowing Winds of Sorrow give unrelenting misery to everyone here.",
      index: HellLevel.WrongfulDead,
      entryEffect: () => {
        if (this.exitFound){
          if (!this.hells[HellLevel.WrongfulDead].activities.includes(this.teachTheWay)){
            this.hells[HellLevel.WrongfulDead].activities.push(this.teachTheWay);
          }
        }
      },
      dailyEffect: () => {
        this.characterService.characterState.status.health.value -= 500;
        this.characterService.characterState.status.stamina.value -= 100;
      },
      completeEffect: () => {
        this.logService.addLogMessage("You sigh in relief as you usher the last of the damned out. The hell is finally empty. Well, empty except for the monstrous Hell Lord coming toward you.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.searchForExit],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "These people don't belong here. Get them out.",
      successCheck: () => {
        return this.soulsEscaped > 1000000;
      }
    },
    {
      name: "Hell of Dismemberment",
      description: "Torment for tomb-raiders and grave-robbers. The demons here look awfully handy with those giant axes.",
      index: HellLevel.Dismemberment,
      completeEffect: () => {
        this.logService.addLogMessage("As you help more of the damned here to resolve their crimes, an angry cry sounds through the hell. The lord has arrived.", "STANDARD", "STORY")
      },
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation, this.interrogate],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney, this.recoverTreasure, this.replaceTreasure],
      hint: "",
      successCheck: () => {
        // TODO: tune this
        return this.relicsReturned > 10000;
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
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
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
      activities: [this.activityService.Resting, this.activityService.MindCultivation, this.activityService.BodyCultivation, this.activityService.CoreCultivation, this.activityService.SoulCultivation],
      projectionActivities: [this.activityService.OddJobs, this.burnMoney],
      hint: "",
      successCheck: () => {
        return false;
      }
    }
  ]


}

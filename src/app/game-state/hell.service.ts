import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { Activity, ActivityType } from './activity';
import { MatTabGroup } from '@angular/material/tabs';

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
  effect: () => void;
}

export interface HellProperties {
  inHell: boolean,
  currentHell: number
}

@Injectable({
  providedIn: 'root'
})
export class HellService {

  inHell = false;
  currentHell = -1;
  activityService?: ActivityService;


  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private battleService: BattleService
  ) {
    /*
    mainLoopService.longTickSubject.subscribe(() => {

    });
    */

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  reset(){
    this.currentHell = -1;
  }

  getProperties(): HellProperties {
    return {
      inHell: this.inHell,
      currentHell: this.currentHell
    }
  }

  setProperties(properties: HellProperties) {
    this.currentHell = properties.currentHell;
    if (!this.activityService){
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
  }

  getActivityList(){

    if (!this.activityService){
      this.activityService = this.injector.get(ActivityService);
    }
    const newList: Activity[] = [];
    if (this.currentHell === -1){
      // between hells now, choose which one to enter
      this.activityService.activityHeader = "Choose your Hell";
      this.activityService.activityHeaderDescription = "The heavens have cast you down to the depths of hell. You'll need to defeat every level to escape.";
      this.setEnterHellsArray(newList);
    } else {
      this.activityService.activityHeader = this.hells[this.currentHell].name;
      this.activityService.activityHeaderDescription = this.hells[this.currentHell].description;

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
        this.currentHell = -1;
        this.activityService?.reloadActivities();
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }
  }

  setEnterHellsArray(newList: Activity[]) {
    for (const hell of this.hells){
      newList.push({
          level: 0,
          name: [hell.name],
          activityType: ActivityType.Hell + hell.index,
          description: [hell.description],
          consequenceDescription: [""],
          consequence: [() => {
            this.currentHell = hell.index;
            this.activityService?.reloadActivities();
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
      effect: () => {
        /*
        Task: recruit X followers
        During the level: Charisma nerfed
        */
      }
    },
    {
      name: "Hell of Scissors",
      description: "Torment for those who ruin marriages. The demons here will cut your fingers right off.",
      index: HellLevel.Scissors,
      effect: () => {
        /*
        Task: defeat X enemies
        During the level: Weapons unusable
        */
      }
    },
    {
      name: "Hell of Trees of Knives",
      description: "Torment for those who cause trouble between family members. The demons here will tie you to a tree made of sharp knives",
      index: HellLevel.TreesOfKnives,
      effect: () => {
        /*
      Task: honor your ancestors with expensive gifts
      During the level: Bloodline effects nerfed
        */
      }
    },
    {
      name: "Hell of Mirrors",
      description: "Torment for those who escaped punishment for their crimes. The mirrors here shine with a terrifying glow.",
      index: HellLevel.Mirrors,
      effect: () => {
          /*
        Task: Fight mirror battles vs yourself
        */
      }
    },
    {
      name: "Hell of Steamers",
      description: "Torment for hypocrites and troublemakers. The steam baskets here are just the right size for you.",
      index: HellLevel.Steamers,
      effect: () => {
        /*
        Task: Rehabilitate some troublemakers
        During the level: Constantly robbed and beaten by troublemakers
        */
      }
    },
    {
      name: "Hell of Copper Pillars",
      description: "Torment for arsonists. The red-hot copper pillars remind you of all those times you played with fire.",
      index: HellLevel.CopperPillars,
      effect: () => {
        /*
        Task: Forge special hammers to break the chains
        During the level: Blacksmithing/mining/smelting nerfed to only allow copper
        */
      }
    },
    {
      name: "Hell of the Mountain of Knives",
      description: "Torment for those who killed for pleasure. The mountain of sharp blades looks like it might be rough on footwear.",
      index: HellLevel.MountainOfKnives,
      effect: () => {
        /*
        Task: climb the mountain, taking damage at every step
        During the level: Increase damage taken based on total kills that life
        */
      }
    },
    {
      name: "Hell of the Mountain of Ice",
      description: "Torment for adulterers and schemers. The chill wind blowing through the gate is so cold it burns.",
      index: HellLevel.MountainOfIce,
      effect: () => {
        /*
        Task: melt the mountain with fire magic
        During the level: Fire lore nerfed, fire lore activities (including blacksmithing) unavailable
        */
      }
    },
    {

      name: "Hell of the Cauldrons of Oil",
      description: "Torment for rapists and abusers. Next on the menu: deep fried immortal.",
      index: HellLevel.CauldronsOfOil,
      effect: () => {
        /*
        Task: Drain the oil, escape the cauldon, then refill the oil
        During the level: Slippery hands - accuracy reduced, weapon falls back into inventory
        */
      }
    },
    {

      name: "Hell of the Cattle Pit",
      description: "Torment for animal abusers. The cows are looking a little restless.",
      index: HellLevel.CattlePit,
      effect: () => {
        /*
        Task: Heal animals
        During the level: Extra tough mad cow monsters, lots of them
        */
      }
    },
    {
      name: "Hell of the Crushing Boulder",
      description: "Torment for child-killer and abondoners. Atlas had it easy compared to these things.",
      index: HellLevel.CrushingBoulder,
      effect: () => {
        /*
        Task: Roll a boulder (strength check)
        During the level:only magical attacks are usable (your hands are busy with the boulder)
        */
      }
    },
    {
      name: "Hell of Mortars and Pestles",
      description: "Torment for food wasters. You didn't really need to eat all those peaches, did you? The diet here is pure hellfire.",
      index: HellLevel.MortarsAndPestles,
      effect: () => {
        /*
      Task: Fast a long time
      During the level: using, selling, or throwing away food resets the timer
        */
      }
    },
    {
      name: "Hell of the Blood Pool",
      description: "Torment for those who disrespect others. The pool looks deep, but it's hard to tell with all that blood.",
      index: HellLevel.BloodPool,
      effect: () => {
        /*
        Task: Swim to the bottom of the pool, break through to drain it
        During the level: Underwater, most activities unavailable
        */
      }
    },
    {
      name: "Hell of the Wrongful Dead",
      description: "Torment for those who gave up their lives too early. Fortunately you've probably never done that. The pounding Rains of Pain and the blowing Winds of Sorrow give unrelenting misery to everyone here.",
      index: HellLevel.WrongfulDead,
      effect: () => {
        /*
        Task: Find the escape (intelligence check), teach everyone the exit (charisma check)
        During the level: Frequent random damage from winds and rain
        */
      }
    },
    {
      name: "Hell of Dismemberment",
      description: "Torment for tomb-raiders and grave-robbers. The demons here look awfully handy with those giant axes.",
      index: HellLevel.Dismemberment,
      effect: () => {
        /*
        Task: Raid the tomb (speed check), put the treasures back (money)
        During the level: Traps
        */
      }
    },
    {

      name: "Hell of the Mountain of Fire",
      description: "Torment for thieves. The volcano where the poor souls are thrown looks a little toasty for comfort.",
      index: HellLevel.MountainOfFire,
      effect: () => {
        /*
        Task: Plug the volcano, ride the explosion out
        During the level: no water-based activities
        */
      }
    },
    {

      name: "Hell of Mills",
      description: "Torment for any who abused their power to oppress the weak. You don't look forward to being ground into immortal flour.",
      index: HellLevel.Mills,
      effect: () => {
        /*
        Task: Endure the mill (toughness check)
        During the level: Constant heavy damage
        */
      }
    },
    {
      name: "Hell of Saws",
      description: "Torment for swindlers and business cheats. The demons sharpen their saws and grin at you. You wish now that you'd stayed out of politics.",
      index: 0,
      effect: () => {
        /*
        Task: Find the final loophole (charisma and intelligence check)
        During the level: Extra tough enemies
        */
      }
    }
  ]
}

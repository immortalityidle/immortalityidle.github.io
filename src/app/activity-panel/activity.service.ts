import { Injectable } from '@angular/core';
import { Activity, ActivityLoopEntry } from '../game-state/activity';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];

  activities: Activity[] = [
    {
      name: 'Odd Jobs',
      description: "Run errands, pull weeds, clean toilet pits, or whatever else you earn a coin doing. Undignified work for a future immortal, but you have to eat to live.",
      consequence: () => {
        const keys = Object.keys(this.characterService.characterState.attributes);
        // randomly choose any of the stats except the last one (spirituality)
        const key = keys[Math.floor(Math.random() * (keys.length - 1))];
        // @ts-ignore
        this.characterService.characterState.attributes[key] += .1;
        this.characterService.characterState.status.stamina.value -= 5;
        this.characterService.characterState.money += 0.1;
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        spirituality: 0
      }
    },
    {
      name: 'Resting',
      description: "Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.",
      consequence: () => {
        this.characterService.characterState.status.stamina.value += (this.characterService.characterState.status.stamina.max / 8);
        if (this.characterService.characterState.status.stamina.value > this.characterService.characterState.status.stamina.max){
          this.characterService.characterState.status.stamina.value = this.characterService.characterState.status.stamina.max;
        }
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        spirituality: 0
      }
    },
    {
      name: 'Begging',
      description: "Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.",
      consequence: () => {
        this.characterService.characterState.attributes.charisma.value += 0.1;
        this.characterService.characterState.status.stamina.value -= 1;
        this.characterService.characterState.money += this.characterService.characterState.attributes.charisma.value * 0.1;
        //TODO: figure out diminishing returns for this
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        spirituality: 0
      }
    },
    {
      name: 'Blacksmithing',
      description: "Mold metal into weapons, armor, and useful things. You need to be strong to be successful at this job.",
      consequence: () => {
        this.characterService.characterState.attributes.strength.value += .1;
        this.characterService.characterState.attributes.toughness.value += .1;
        this.characterService.characterState.status.stamina.value -= 5;
        this.characterService.characterState.money += this.characterService.characterState.attributes.strength.value * 0.1;
      },
      requirements: {
        strength: 10,
        toughness: 10,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        spirituality: 0
      }
    },
    {
      name: 'Gather Herbs',
      description: "Search the natural world for useful herbs.",
      consequence: () => {
        this.characterService.characterState.attributes.intelligence.value += .1;
        this.characterService.characterState.status.stamina.value -= 5;
        //TODO: make adding same things you already have combine stuff in the same slot
        this.inventoryService.addItem({name: "herbs", description: "Useful herbs", quantity: 1});
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 10,
        intelligence: 10,
        charisma: 0,
        spirituality: 0
      }
    }

  ];
  constructor(private characterService: CharacterService,
    private inventoryService: InventoryService) {
    this.activityLoop.push({
      activity: this.activities[0],
      repeatTimes: 8
    });

    this.activityLoop.push(
      {
        activity: this.activities[1],
        repeatTimes: 8
      }
    );
   }
}

import { Injectable } from '@angular/core';
import { Activity, ActivityLoopEntry } from '../game-state/activity';
import { AttributeType } from '../game-state/character';
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
      consequenceDescription: "Increases a random attribute and provides a little money.",
      consequence: () => {
        const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
        // randomly choose any of the stats except the last one (spirituality)
        const key = keys[Math.floor(Math.random() * (keys.length - 1))];
        this.characterService.characterState.increaseAttribute(key, 0.1);
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
      consequenceDescription: "Restores stamina and a little health.",
      consequence: () => {
        this.characterService.characterState.status.stamina.value += (this.characterService.characterState.status.stamina.max / 2);
        this.characterService.characterState.status.health.value += 2;
        this.characterService.characterState.checkOverage();
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
      consequenceDescription: "Increases charisma and provides a little money.",
      consequence: () => {
        this.characterService.characterState.increaseAttribute("charisma",  0.1);
        this.characterService.characterState.status.stamina.value -= 1;
        this.characterService.characterState.money += this.characterService.characterState.attributes.charisma.value * 0.1;
        //TODO: figure out diminishing returns for this
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 0,
        intelligence: 0,
        charisma: 5,
        spirituality: 0
      }
    },
    {
      name: 'Blacksmithing',
      description: "Mold metal into weapons, armor, and useful things. You need to be strong to be successful at this job.",
      consequenceDescription: "Increases strength and toughness and provides a little money.",
      consequence: () => {
        this.characterService.characterState.increaseAttribute("strength",  0.1);
        this.characterService.characterState.increaseAttribute("toughness",  0.1);
        this.characterService.characterState.status.stamina.value -= 25;
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
      consequenceDescription: "",
      consequence: () => {
        this.characterService.characterState.increaseAttribute("intelligence",  0.1);
        this.characterService.characterState.increaseAttribute("speed",  0.1);
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
      repeatTimes: 5
    });

    this.activityLoop.push(
      {
        activity: this.activities[1],
        repeatTimes: 1
      }
    );
   }
}

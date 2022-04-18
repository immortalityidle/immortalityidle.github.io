import { Activity, ActivityLoopEntry } from './activity';
import { Home } from './home';
import { Character } from './character';

export class GameState {
  characterState = new Character();
  activityLoop: ActivityLoopEntry[] = [];
  activities: Activity[] = [
    {
      name: 'Odd Jobs',
      description: "Run errands, pull weeds, clean toilet pits, or whatever else you can earn a coin doing. Undignified work for a future immortal, but you have to eat to live.",
      consequence: () => {
        const keys = Object.keys(this.characterState.attributes);
        // randomly choose any of the stats except the last one (spirituality)
        const key = keys[Math.floor(Math.random() * (keys.length - 1))];
        // @ts-ignore
        this.characterState.attributes[key].value += .1;
        this.characterState.status.stamina.value -= 5;
        this.characterState.money += 0.1;
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
      description: "Take a break and recover from all the hard work you've been doing to become an immortal.",
      consequence: () => {
        this.characterState.status.stamina.value += (this.characterState.status.stamina.max / 2);
        if (this.characterState.status.stamina.value > this.characterState.status.stamina.max){
          this.characterState.status.stamina.value = this.characterState.status.stamina.max;
        }
        this.characterState.status.health.value += 2;
        if (this.characterState.status.health.value > this.characterState.status.health.max){
          this.characterState.status.health.value = this.characterState.status.health.max;
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
        this.characterState.attributes.charisma.value += 0.1;
        this.characterState.status.stamina.value -= 1;
        this.characterState.money += this.characterState.attributes.charisma.value * 0.1;
        //TODO: figure out diminishing returns for this
      },
      requirements: {
        strength: 0,
        toughness: 0,
        speed: 0,
        intelligence: 0,
        charisma: 10,
        spirituality: 0
      }
    },
    {
      name: 'Apprentice Blacksmithing',
      description: "Work for the local blacksmith. You mostly pump the bellows and endure the heat, but at least you can watch them work and learn a few things.",
      consequence: () => {
        this.characterState.attributes.strength.value += .1;
        this.characterState.attributes.toughness.value += .1;
        this.characterState.status.stamina.value -= 25;
        this.characterState.money += this.characterState.attributes.strength.value * 0.1;
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
      name: 'Blacksmithing',
      description: "Mold metal into weapons, armor, and useful things.",
      consequence: () => {
        this.characterState.attributes.strength.value += .1;
        this.characterState.attributes.toughness.value += .1;
        this.characterState.status.stamina.value -= 25;
        this.characterState.money += this.characterState.attributes.strength.value * 0.1;
        this.characterState.inventory.addItem({name: "herbs", description: "Useful herbs", quantity: 1});
      },
      requirements: {
        strength: 100,
        toughness: 100,
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
        this.characterState.attributes.intelligence.value += .1;
        this.characterState.attributes.speed.value += .1;
        this.characterState.status.stamina.value -= 5;
        //TODO: make adding same things you already have combine stuff in the same slot
        this.characterState.inventory.addItem({name: "herbs", description: "Useful herbs", quantity: 1});
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

  homesList: Home[] = [
    {
      name: "Squatter Tent",
      description: "A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The owner of the land may not like that you're here.",
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      consequence: () => {
        if (Math.random() < 0.3){
          console.log("You got roughed up by the owner of the field. You should probably buy your own land.");
          this.characterState.status.health.value--;
        }
      }
    },
    {
      name: "Your Very Own Tent",
      description: "A decent tent pitched on your own bit of land.",
      cost: 100,
      costPerDay: 0,
      landRequired: 1,
      consequence: () => {
        this.characterState.status.health.value += 1;
        this.characterState.status.stamina.value += 1;
      }
    }
  ];

  home: Home;

  constructor() {

    this.home = this.homesList[0];
    console.log(this.home);
    this.activityLoop.push({
      activity: this.activities[0],
      repeatTimes: 3
    });

    this.activityLoop.push(
      {
        activity: this.activities[1],
        repeatTimes: 1
      }
    );

  }
}

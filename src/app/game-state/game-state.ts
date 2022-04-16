import { Activity, ActivityLoopEntry } from './activity';
import { Character } from './character';

export class GameState {
  characterState = new Character();
  activityLoop: ActivityLoopEntry[] = [];
  activities: Activity[] = [
    {
      name: 'Odd Jobs',
      description: "Run errands, pull weeds, clean toilet pits, or whatever else you earn a coin doing. Undignified work for a future immortal, but you have to eat to live.",
      consequence: () => {
        const keys = Object.keys(this.characterState.attributes);
        // randomly choose any of the stats except the last one (spirituality)
        const key = keys[Math.floor(Math.random() * (keys.length - 1))];
        // @ts-ignore
        this.characterState.attributes[key] += .1;
        this.characterState.status.stamina.current -= 5;
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
      description: "Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.",
      consequence: () => {
        this.characterState.status.stamina.current += (this.characterState.status.stamina.max / 8);
        if (this.characterState.status.stamina.current > this.characterState.status.stamina.max){
          this.characterState.status.stamina.current = this.characterState.status.stamina.max;
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
        this.characterState.attributes.charisma += 0.1;
        this.characterState.status.stamina.current -= 1;
        this.characterState.money += this.characterState.attributes.charisma * 0.1;
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
        this.characterState.attributes.strength += .1;
        this.characterState.status.stamina.current -= 5;
        this.characterState.money += this.characterState.attributes.strength * 0.1;
      },
      requirements: {
        strength: 10,
        toughness: 10,
        speed: 0,
        intelligence: 0,
        charisma: 0,
        spirituality: 0
      }
    }
  ];

  constructor() {

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

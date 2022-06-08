import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';


@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less', '../app.component.less']
})
export class HealthPanelComponent {

  Math: Math;
  constructor(public characterService: CharacterService) {
    this.Math = Math;
  }

  getLifespanTooltip(){
    if (this.characterService.characterState.foodLifespan + this.characterService.characterState.alchemyLifespan + this.characterService.characterState.statLifespan + this.characterService.characterState.spiritualityLifespan <= 0){
      return "You have done nothing to extend your lifespan";
    }
    let tooltip = "Your lifespan is extended by"
    if (this.characterService.characterState.foodLifespan > 0){
      tooltip += "<br>Healthy Food: " + this.yearify(this.characterService.characterState.foodLifespan);
    }
    if (this.characterService.characterState.alchemyLifespan > 0){
      tooltip += "<br>alchemy: " + this.yearify(this.characterService.characterState.alchemyLifespan);
    }
    if (this.characterService.characterState.statLifespan > 0){
      tooltip += "<br>Basic Attributes: " + this.yearify(this.characterService.characterState.statLifespan);
    }
    if (this.characterService.characterState.spiritualityLifespan > 0){
      tooltip += "<br>Spirituality: " + this.yearify(this.characterService.characterState.spiritualityLifespan);
    }
    return tooltip;
  }

  yearify(value: number){
    if (value < 365){
      return "< 1 year";
    } else if (value < 730){
      return "1 year";
    } else {
      return Math.floor(value / 365) + " years";
    }
  }

}

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


}

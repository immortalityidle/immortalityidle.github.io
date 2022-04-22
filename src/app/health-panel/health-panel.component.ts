import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';


@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less']
})
export class HealthPanelComponent {

  constructor(public characterService: CharacterService) { }

}

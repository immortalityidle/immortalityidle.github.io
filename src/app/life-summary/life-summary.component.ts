import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-life-summary',
  templateUrl: './life-summary.component.html',
  styleUrls: ['./life-summary.component.less', '../app.component.less']
})
export class LifeSummaryComponent {

  causeOfDeath: string = "";
  attributeGains: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {causeOfDeath: string, attributeGains: string},
    public characterService: CharacterService
  ) { 
    this.causeOfDeath = data.causeOfDeath;
    this.attributeGains = data.attributeGains;
  }

  showLifeSummaryChange(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.characterService.characterState.showLifeSummary = event.target.checked;
  }

}

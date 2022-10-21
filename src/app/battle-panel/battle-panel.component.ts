import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BattleOptionsPanelComponent } from '../battle-options-panel/battle-options-panel.component';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-panel',
  templateUrl: './battle-panel.component.html',
  styleUrls: ['./battle-panel.component.less', '../app.component.less']
})
export class BattlePanelComponent implements OnInit {

  Math: Math;
  constructor(
    public battleService: BattleService,
    public characterService: CharacterService,
    public dialog: MatDialog

  ){
    this.Math = Math;
  }

  ngOnInit(): void {
    // so that eslint stops whining
    let a;
  }

  autoTroubleChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.battleService.autoTroubleEnabled = event.target.checked;
  }

  battleOptions(){
    const dialogRef = this.dialog.open(BattleOptionsPanelComponent, {
      width: '700px',
      data: {someField: 'foo'},
      autoFocus: false
    });

  }
}

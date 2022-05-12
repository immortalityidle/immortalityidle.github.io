import { Component, OnInit } from '@angular/core';
import { BattleService, Enemy } from './battle.service';

@Component({
  selector: 'app-battle-panel',
  templateUrl: './battle-panel.component.html',
  styleUrls: ['./battle-panel.component.less', '../app.component.less']
})
export class BattlePanelComponent implements OnInit {

  constructor(public battleService: BattleService) { }

  ngOnInit(): void {
  }

}

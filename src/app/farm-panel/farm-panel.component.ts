import { Component, OnInit } from '@angular/core';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less']
})
export class FarmPanelComponent {

  constructor(public homeService: HomeService) { 

  }

}

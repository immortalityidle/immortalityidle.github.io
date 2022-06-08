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

  clearClicked(event: MouseEvent){
    event.preventDefault();
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.clearField();
      }
    } else if (event.ctrlKey){
      while (this.homeService.fields.length > 0){
        this.homeService.clearField();
      }
    } else {
      this.homeService.clearField();
    }

  }

}

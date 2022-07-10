import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-export-panel',
  templateUrl: './export-panel.component.html',
  styleUrls: ['./export-panel.component.less', '../app.component.less']
})
export class ExportPanelComponent {

  constructor(private gameStateService: GameStateService) {

  }

  importClick(value: string){
    this.gameStateService.importGame(value);
  }

  exportClick(){
    let textArea = <HTMLTextAreaElement>document.getElementById('saveFileTextArea');
    textArea.value = this.gameStateService.getGameExport();
  }
}

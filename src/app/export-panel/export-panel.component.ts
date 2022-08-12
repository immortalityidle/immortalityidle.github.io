import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import {environment} from '../../environments/environment';

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
    this.gameStateService.updateImportFlagKey(true);
    // eslint-disable-next-line no-self-assign
    window.location.href = window.location.href;
  }

  exportClick(){
    const textArea = <HTMLTextAreaElement>document.getElementById('saveFileTextArea');
    textArea.value = this.gameStateService.getGameExport();
  }

  importFileClick(event: any){
    const file = event.target.files[0];
    if(file) {
      const Reader = new FileReader();
      const gameStateService = this.gameStateService;
      Reader.readAsText(file, "UTF-8");
      Reader.onload = function () {
        if (typeof Reader.result === 'string') {
          gameStateService.importGame(Reader.result)
        }
      }
    }
  }

  exportFileClick(){
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.gameStateService.getGameExport())}`);
    element.setAttribute('download', `Immortality_Idle_${this.gameStateService.isExperimental ? "Experimental" : "v" + environment.appVersion}_${new Date().toISOString()}.txt`);
    const event = new MouseEvent("click");
    element.dispatchEvent(event);
  }
}

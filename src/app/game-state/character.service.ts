import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { Character } from './character';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  characterState = new Character();

  constructor(
    mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      this.characterState.age++;
      this.characterState.status.nourishment.value--;
      // check for death
      if (this.characterState.age >= this.characterState.lifespan) {
        this.logService.addLogMessage(
          "You reach the end of your natural life and pass away from old age. You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
        );
        this.reincarnationService.reincarnate();
      }
      if (this.characterState.status.health.value <= 0) {
        this.logService.addLogMessage(
          "You succumb to your wounds and pass away. You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
        );
        this.reincarnationService.reincarnate();
      }
      if (this.characterState.status.nourishment.value <= 0) {
        this.logService.addLogMessage(
          "You starve to death. You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
        );
        this.reincarnationService.reincarnate();
      }
    });

    reincarnationService.reincarnateSubject.subscribe(()=> {
      this.characterState.reincarnate();
    })
  }
}

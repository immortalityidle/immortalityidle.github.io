import { AutoPauserService } from './autoPauser.service';
import { MainLoopService } from './main-loop.service';
import{ Character } from './character';

export abstract class AutoPauser {

  constructor(
    protected autoPauserService: AutoPauserService,
    protected character: character,
    protected mainLoopService: MainLoopService ) {}

  /**
   * Checks if permissions are correct to run this autoPauser
   */
  abstract isEnabled(): boolean;

  /**
   * Performs the check
   * @param reserveAmount Passed in savings amount to prevent over-buying
   */
  abstract run(value?: number, years?: boolean): void;

  /**
   * Checks if this autoPauser's condition is remotely reachable, for example, an immortal won't trigger a death nor lifespan autoPauser
   */
  abstract isPossible(): boolean;

}

export class DeathAutoPauser extends AutoPauser {

  isEnabled(): boolean {
    return this.autoPauserService.autoPauserSettings.find('death').enabled;
  }

  run() {
    if (this.isEnabled) {
      this.mainLoopService.pause = true;
    }
  }

  isPossible(): boolean {
    return !this.character.immortal;
  }

}


export class AgeAutoPauser extends AutoPauser {

  isEnabled(): boolean {
    return this.autoPauserService.autoPauserSettings.find('age').enabled;
  }

  run(value: 18, years: true) {//TODO this one might not work well, who knows
    if (this.isEnabled) {
      const isAge = this.character.age;
      let pauseAge = value;
      if (years) {
        pauseAge *= 365;
      }
      if (isAge == pauseAge){
        this.mainLoopService.pause = true;
      }
    }
  }

  isPossible(): boolean {
    return true;
  }

}

export class LifespanAutoPauser extends AutoPauser {

  isEnabled(): boolean {
    return this.autoPauserService.autoPauserSettings.find('lifespan').enabled;
  }

  run(value: 1, years: false) {
    if (this.isEnabled) {
      const timeUntilPassing = this.character.lifespan - this.character.age;
      let pauseIfTimeLeft = value;
      if (years) {
        pauseIfTimeLeft *= 365;
      }
      if (timeUntilPassing <= pauseIfTimeLeft){
        this.mainLoopService.pause = true;
      }
    }
  }

  isPossible(): boolean {
    return !this.character.immortal;
  }

}

export class TimeAutoPauser extends AutoPauser {
  ticksSincePause = 0;

  isEnabled(): boolean {
    return this.autoPauserService.autoPauserSettings.find('time').enabled;
  }

  run(value: 1, years: true) {
    if (this.isEnabled) {
      let timeToWait = 1;
      if (years) {
        timeToWait *= 365
      }
      if (timeToWait <= this.ticksSincePause) {
        this.ticksSincePause = 0;
        this.mainLoopService.pause = true;
      }
    }
  }

  isPossible(): boolean {
    this.ticksSincePause++;
    return true;
  }

}
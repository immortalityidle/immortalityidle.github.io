import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { AutoPauser, AgeAutoPauser, LifespanAutoPauser, TimeAutoPauser, DeathAutoPauser } from './autoPauser';

export interface AutoPauserProperties {
  autoPauserSettingsUnlocked: boolean,
  autoPauserSettings: AutoPauserSetting[]
}

export type AutoPauserType = 'age' | 'lifespan' | 'time' | 'death';// | 'newActivity' | 'items' | 'health' | 'stamina';
export type AutoPauserSetting = {
  label: string,
  type: AutoPauserType,
  enabled: boolean
}
type AutoPausersMap = {[key in AutoPauserType]: AutoPauser}

@Injectable({
  providedIn: 'root'
})
export class AutoPauserService {
  autoPauserSettingsUnlocked = false;
  
  autoPauserSettings: AutoPauserSetting[] = this.getDefaultSettings();

  autopausers: AutoPausersMap = {
    'age': new AgeAutoPauser(this, this.characterService),
    'lifespan': new LifespanAutoPauser(this, this.characterService),
    'time': new TimeAutoPauser(this, this.characterService),
    'death': new DeathAutoPauser(this, this.characterService)
  }

  constructor(
    private characterService: CharacterService,
    mainLoopService: MainLoopService,//TODO update with orioer signature when completed
  ) {
    mainLoopService.tickSubject.subscribe(() => {//TODO do we need to tick the pausers, or do things that trigger the pauser tick?
      if (this.characterService.characterState.dead) {
        return;
      }
      this.tick();
    });
  }

  getProperties(): AutoPauserProperties {
    return {
      autoPauserSettingsUnlocked: this.autoPauserSettingsUnlocked,
      autoPauserSettings: this.autoPauserSettings
    };
  }

  setProperties(properties: AutoPauserProperties) {
    if (properties) {
      this.autoPauserSettingsUnlocked = properties.autoPauserSettingsUnlocked || false;
      this.autoPauserSettings = properties.autoPauserSettings || this.getDefaultSettings();
    } else {
      this.autoPauserSettingsUnlocked = false;
      this.autoPauserSettings = this.getDefaultSettings();
    }
  }

  getDefaultSettings(): AutoPauserSetting[] {
    return [{ 
      label: 'Death',
      type: 'death',
      enabled: true,
      waitForFinish: true
    //, TODO replace this with settings for all autoPausers
    }];
  }

  tick() {
    // Use auto-buy reserve amount if enabled in settings, otherwise default to 10 days living expenses (food + lodging)
    const reserveAmount = this.homeService.useAutoBuyReserve ? this.homeService.autoBuyReserveAmount : (this.homeService.home.costPerDay + 1) * 10;

    // go through priorities in order
    for (const setting of this.autoBuyerSettings) {
      const autobuyer: AutoBuyer = this.autobuyers[setting.type];

      // Skip to the next one if we're already done, or if we can't make any progress
      if (!setting.enabled || !autobuyer.shouldRun() || autobuyer.isBlocked() || autobuyer.isComplete()) {
        continue;
      }

      // If we're set to wait for each priority, don't continue if we're just waiting for something to complete
      // (Ex. waiting for house to finish upgrade)
      if (autobuyer.isWaiting() && setting.waitForFinish) {
        break;
      } else if (autobuyer.isWaiting()) {
        continue;
      }

      // Autobuy, initiate!
      autobuyer.run(reserveAmount);

      // If we're set to wait for each priority, don't continue if we're not complete
      if (!autobuyer.isComplete() && setting.waitForFinish) {
        break;
      }
    }
  }
}

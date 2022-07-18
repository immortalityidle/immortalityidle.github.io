import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { AutoBuyer, FurnitureAutoBuyer, HomeAutoBuyer, LandAndFieldAutoBuyer } from './autoBuyer';

export interface AutoBuyerProperties {
  autoBuyerSettingsUnlocked: boolean,
  autoBuyerSettings: AutoBuyerSetting[]
}

export type AutoBuyerType = 'home' | 'land' | 'furniture';
export type AutoBuyerSetting = {
  label: string,
  type: AutoBuyerType,
  enabled: boolean,
  waitForFinish: boolean
}
type AutoBuyersMap = {[key in AutoBuyerType]: AutoBuyer}

@Injectable({
  providedIn: 'root'
})
export class AutoBuyerService {
  autoBuyerSettingsUnlocked: boolean = false;
  
  autoBuyerSettings: AutoBuyerSetting[] = [
    { 
      label: 'Home',
      type: 'home',
      enabled: true,
      waitForFinish: true
    },
    {
      label: 'Furniture',
      type: 'furniture',
      enabled: true,
      waitForFinish: true
    },
    { 
      label: 'Land/Field',
      type: 'land',
      enabled: true,
      waitForFinish: true
    }
  ];

  autobuyers: AutoBuyersMap = {
    'home': new HomeAutoBuyer(this, this.homeService, this.characterService),
    'land': new LandAndFieldAutoBuyer(this, this.homeService, this.characterService),
    'furniture': new FurnitureAutoBuyer(this, this.homeService, this.characterService)
  }

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService,
    mainLoopService: MainLoopService,
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }
      this.tick();
    });
  }

  getProperties(): AutoBuyerProperties {
    return {
      autoBuyerSettingsUnlocked: this.autoBuyerSettingsUnlocked,
      autoBuyerSettings: this.autoBuyerSettings
    };
  }

  setProperties(properties: AutoBuyerProperties) {
    this.autoBuyerSettingsUnlocked = properties.autoBuyerSettingsUnlocked || false;
    this.autoBuyerSettings = properties.autoBuyerSettings;
  }

  tick() {
    // Use auto-buy reserve amount if enabled in settings, otherwise default to 10 days living expenses (food + lodging)
    let reserveAmount = this.homeService.useAutoBuyReserve ? this.homeService.autoBuyReserveAmount : (this.homeService.home.costPerDay + 1) * 10;

    // go through priorities in order
    for (let setting of this.autoBuyerSettings) {
      let autobuyer: AutoBuyer = this.autobuyers[setting.type];

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
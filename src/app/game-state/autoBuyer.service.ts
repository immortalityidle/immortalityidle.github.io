import { Injectable } from '@angular/core';
import { AutoBuyer, FurnitureAutoBuyer, HomeAutoBuyer, LandAndFieldAutoBuyer } from './autoBuyer';
import { ServicesService } from './services.service';

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
  autoBuyerSettingsUnlocked = false;
  
  autoBuyerSettings: AutoBuyerSetting[] = this.getDefaultSettings();

  autobuyers: AutoBuyersMap = {
    'home': new HomeAutoBuyer(this, this.services.homeService, this.services.characterService),
    'land': new LandAndFieldAutoBuyer(this, this.services.homeService, this.services.characterService),
    'furniture': new FurnitureAutoBuyer(this, this.services.homeService, this.services.characterService)
  }

  constructor(
    private services: ServicesService
  ) {}

  init(): AutoBuyerService {
    this.services.mainLoopService.tickSubject.subscribe(() => {
      if (this.services.characterService.characterState.dead) {
        return;
      }
      this.tick();
    });
    return this;
  }

  getProperties(): AutoBuyerProperties {
    return {
      autoBuyerSettingsUnlocked: this.autoBuyerSettingsUnlocked,
      autoBuyerSettings: this.autoBuyerSettings
    };
  }

  setProperties(properties: AutoBuyerProperties) {
    if (properties) {
      this.autoBuyerSettingsUnlocked = properties.autoBuyerSettingsUnlocked || false;
      this.autoBuyerSettings = properties.autoBuyerSettings || this.getDefaultSettings();
    } else {
      this.autoBuyerSettingsUnlocked = false;
      this.autoBuyerSettings = this.getDefaultSettings();
    }
  }

  getDefaultSettings(): AutoBuyerSetting[] {
    return [{ 
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
    }];
  }

  tick() {
    if (this.services.hellService?.inHell){
      return;
    }
    // Use auto-buy reserve amount if enabled in settings, otherwise default to 10 days living expenses (food + lodging)
    const reserveAmount = this.services.homeService.useAutoBuyReserve ? this.services.homeService.autoBuyReserveAmount : (this.services.homeService.home.costPerDay + 1) * 10;

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
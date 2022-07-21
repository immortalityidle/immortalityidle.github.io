import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { Character } from './character';
import { AutoPauser, AgeAutoPauser, LifespanAutoPauser, TimeAutoPauser, DeathAutoPauser } from './autoPauser';

export interface AutoPauserProperties {
  autoPauserSettingsUnlocked: boolean,
  autoPauserSettings: AutoPauserSetting[]
}

export type AutoPauserType = 'age' | 'lifespan' | 'time' | 'death';// | 'newActivity' | 'items' | 'health' | 'stamina';
export type AutoPauserSetting = {
  label: string,
  type: AutoPauserType,
  enabled: boolean,
  value: number,
  years: boolean
}
type AutoPausersMap = {[key in AutoPauserType]: AutoPauser}

@Injectable({
  providedIn: 'root'
})
export class AutoPauserService {
  autoPauserSettingsUnlocked = false;
  
  autoPauserSettings: AutoPauserSetting[] = this.getDefaultSettings();

  autopausers: AutoPausersMap = {
    'age': new AgeAutoPauser(this, this.character, this.mainLoopService),
    'lifespan': new LifespanAutoPauser(this, this.character, this.mainLoopService),
    'time': new TimeAutoPauser(this, this.character, this.mainLoopService),
    'death': new DeathAutoPauser(this, this.character, this.mainLoopService)
  }

  constructor(
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    character: Character
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }
      this.tick();
    });
    
    reincarnationService.reincarnateSubject.subscribe(() => {
        this.autopausers.death.run();
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
      label: 'Age',
      type: 'age',
      enabled: false,
      value: 18,
      years: true
    },
    {
      label: 'Lifespan',
      type: 'lifespan',
      enabled: false,
      value: 1,
      years: true
    },
    {
      label: 'Time',
      type: 'time',
      enabled: false,
      value: 1,
      years: true
    },
    {
      label: 'Death',
      type: 'death',
      enabled: true,
      value: 0,
      years: false
    }];
  }

  tick() {
    // Set any constants

    // go through pausers
    for (const setting of this.autoPauserSettings) {
      const autopauser: AutoPauser = this.autopausers[setting.type];

      // Make any checks we want
      if (!autopauser.enabled || !autopauser.isPossible()) {
        continue;
      }

      autopauser.run(autopauser.value, autopauser.years);
    }
  }
}

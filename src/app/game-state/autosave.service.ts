import { Injectable, Injector, OnInit } from '@angular/core';

  export interface AutoSaveProperties {
	autoSaveSettings: AutoSaveSettings[]
  }

  export type AutoSaveSettings = {
	interval: number
  }

  @Injectable({
	providedIn: 'root'
  })
  export class AutoSaveService{
	autoSaveSettings: AutoSaveSettings[] = this.getDefaultSettings();
	
	constructor(){}

	getProperties(): AutoSaveProperties{
		return {
			autoSaveSettings: this.autoSaveSettings
		};
	}

	setProperties(properties: AutoSaveProperties) {
		if (properties){
			this.autoSaveSettings = properties.autoSaveSettings || this.getDefaultSettings();
		}
		else {
			this.autoSaveSettings = this.getDefaultSettings();
		}
	} 

	getDefaultSettings(): AutoSaveSettings[] {
		return[{
			interval: 10
		}];
	}
  }
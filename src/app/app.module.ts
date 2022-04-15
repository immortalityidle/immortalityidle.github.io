import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import {MatTabsModule} from '@angular/material/tabs';
import { TimePanelComponent } from './time-panel/time-panel.component';
import { AttributesPanelComponent } from './attributes-panel/attributes-panel.component';
import { HealthPanelComponent } from './health-panel/health-panel.component';
import { HomePanelComponent } from './home-panel/home-panel.component';
import { LogPanelComponent } from './log-panel/log-panel.component';
import { InventoryPanelComponent } from './inventory-panel/inventory-panel.component';
import { ActivityPanelComponent } from './activity-panel/activity-panel.component';
import { EquipmentPanelComponent } from './equipment-panel/equipment-panel.component';

@NgModule({
  declarations: [
    AppComponent,
    TimePanelComponent,
    AttributesPanelComponent,
    HealthPanelComponent,
    HomePanelComponent,
    LogPanelComponent,
    InventoryPanelComponent,
    ActivityPanelComponent,
    EquipmentPanelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatTabsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

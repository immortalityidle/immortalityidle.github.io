import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, CamelToTitlePipe, FloorPipe, BigNumberPipe } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TimePanelComponent } from './time-panel/time-panel.component';
import { AttributesPanelComponent } from './attributes-panel/attributes-panel.component';
import { HealthPanelComponent } from './health-panel/health-panel.component';
import { HomePanelComponent } from './home-panel/home-panel.component';
import { LogPanelComponent } from './log-panel/log-panel.component';
import { InventoryPanelComponent } from './inventory-panel/inventory-panel.component';
import { ActivityPanelComponent } from './activity-panel/activity-panel.component';
import { EquipmentPanelComponent } from './equipment-panel/equipment-panel.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { TooltipModule } from 'ng2-tooltip-directive';
import { BattlePanelComponent } from './battle-panel/battle-panel.component';
import { FurnitureStoreModalComponent } from './furniture-store-modal/furniture-store-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { FarmPanelComponent } from './farm-panel/farm-panel.component';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';

const materialModules = [
  MatDialogModule,
  MatIconModule
];

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
    EquipmentPanelComponent,
    FloorPipe,
    CamelToTitlePipe,
    BigNumberPipe,
    ManualStoreModalComponent,
    BattlePanelComponent,
    FurnitureStoreModalComponent,
    AscensionStoreModalComponent,
    OptionsModalComponent,
    FarmPanelComponent,
    AchievementPanelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    CommonModule,
    TooltipModule.forRoot({'show-delay': 500, 'hideDelay': 50}),
    ...materialModules
  ],
  exports: [
    ...materialModules
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

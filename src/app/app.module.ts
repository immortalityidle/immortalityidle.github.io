import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, CamelToTitlePipe, FloorPipe, BigNumberPipe } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TimePanelComponent } from './time-panel/time-panel.component';
import { AttributesPanelComponent } from './attributes-panel/attributes-panel.component';
import { FollowersPanelComponent } from './followers-panel/followers-panel.component';
import { PetsPanelComponent } from './pets-panel/pets-panel.component';
import { HealthPanelComponent } from './health-panel/health-panel.component';
import { HomePanelComponent } from './home-panel/home-panel.component';
import { LogPanelComponent } from './log-panel/log-panel.component';
import { InventoryPanelComponent } from './inventory-panel/inventory-panel.component';
import { ActivityPanelComponent } from './activity-panel/activity-panel.component';
import { PortalPanelComponent } from './portal-panel/portal-panel.component';
import { EquipmentPanelComponent } from './equipment-panel/equipment-panel.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { BattlePanelComponent } from './battle-panel/battle-panel.component';
import { FurnitureStoreModalComponent } from './furniture-store-modal/furniture-store-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { FarmPanelComponent } from './farm-panel/farm-panel.component';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';
import { ImpossibleTaskPanelComponent } from './impossible-task-panel/impossible-task-panel.component';
import { TutorialPanelComponent } from './tutorial-panel/tutorial-panel.component';
import { ChangelogPanelComponent } from './changelog-panel/changelog-panel.component';
import { FollowerManagementPanelComponent } from './follower-management-panel/follower-management-panel.component';
import { TimeOptionsPanelComponent } from './time-options-panel/time-options-panel.component';
import { LogFilterPanelComponent } from './log-filter-panel/log-filter-panel.component';
import { StatisticsPanelComponent } from './statistics-panel/statistics-panel.component';
import { TextPanelComponent } from './text-panel/text-panel.component';
import { BattleOptionsPanelComponent } from './battle-options-panel/battle-options-panel.component';
import { SaveModalComponent } from './save-modal/save-modal.component';
import { OfflineModalComponent } from './offline-modal/offline-modal.component';
import { LifeSummaryComponent } from './life-summary/life-summary.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

const materialModules = [MatDialogModule, MatIconModule, MatTabsModule, MatTooltipModule];

@NgModule({
  declarations: [
    AppComponent,
    TimePanelComponent,
    AttributesPanelComponent,
    FollowersPanelComponent,
    PetsPanelComponent,
    HealthPanelComponent,
    HomePanelComponent,
    LogPanelComponent,
    InventoryPanelComponent,
    ActivityPanelComponent,
    PortalPanelComponent,
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
    AchievementPanelComponent,
    ImpossibleTaskPanelComponent,
    TutorialPanelComponent,
    ChangelogPanelComponent,
    FollowerManagementPanelComponent,
    TimeOptionsPanelComponent,
    LogFilterPanelComponent,
    StatisticsPanelComponent,
    TextPanelComponent,
    BattleOptionsPanelComponent,
    SaveModalComponent,
    OfflineModalComponent,
    LifeSummaryComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    CommonModule,
    DragDropModule,
    ...materialModules,
  ],
  exports: [...materialModules],
  providers: [
    TitleCasePipe,
    BigNumberPipe,
    MatSnackBar,
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { disableTooltipInteractivity: true, showDelay: 500 } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

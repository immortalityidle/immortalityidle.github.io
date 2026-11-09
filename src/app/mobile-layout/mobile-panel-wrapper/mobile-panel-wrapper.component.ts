import { Component, forwardRef, inject, input, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivityPanelComponent } from 'src/app/activity-panel/activity-panel.component';
import { AttributesPanelComponent } from 'src/app/attributes-panel/attributes-panel.component';
import { BattlePanelComponent } from 'src/app/battle-panel/battle-panel.component';
import { ContemplationPanelComponent } from 'src/app/contemplation-panel/contemplation-panel.component';
import { CraftingPanelComponent } from 'src/app/crafting-panel/crafting-panel.component';
import { DivineDuelsPanelComponent } from 'src/app/divine-duels-panel/divine-duels-panel.component';
import { EquipmentPanelComponent } from 'src/app/equipment-panel/equipment-panel.component';
import { FarmPanelComponent } from 'src/app/farm-panel/farm-panel.component';
import { FollowersPanelComponent } from 'src/app/followers-panel/followers-panel.component';
import { GameStateService, Panel } from 'src/app/game-state/game-state.service';
import { HealthPanelComponent } from 'src/app/health-panel/health-panel.component';
import { HellStatusPanelComponent } from 'src/app/hell-status-panel/hell-status-panel.component';
import { HomePanelComponent } from 'src/app/home-panel/home-panel.component';
import { ImpossibleTaskPanelComponent } from 'src/app/impossible-task-panel/impossible-task-panel.component';
import { InventoryPanelComponent } from 'src/app/inventory-panel/inventory-panel.component';
import { LocationPanelComponent } from 'src/app/location-panel/location-panel.component';
import { LogPanelComponent } from 'src/app/log-panel/log-panel.component';
import { PetsPanelComponent } from 'src/app/pets-panel/pets-panel.component';
import { PortalPanelComponent } from 'src/app/portal-panel/portal-panel.component';
import { SchedulePanelComponent } from 'src/app/schedule-panel/schedule-panel.component';
import { TechniquePanelComponent } from 'src/app/technique-panel/technique-panel.component';
import { TimePanelComponent } from 'src/app/time-panel/time-panel.component';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';

@Component({
  selector: 'app-mobile-panel-wrapper',
  imports: [
    MatIconModule,
    forwardRef(() => TimePanelComponent),
    forwardRef(() => SchedulePanelComponent),
    forwardRef(() => AttributesPanelComponent),
    forwardRef(() => HealthPanelComponent),
    forwardRef(() => ActivityPanelComponent),
    forwardRef(() => BattlePanelComponent),
    forwardRef(() => EquipmentPanelComponent),
    forwardRef(() => HomePanelComponent),
    forwardRef(() => InventoryPanelComponent),
    forwardRef(() => LogPanelComponent),
    forwardRef(() => PortalPanelComponent),
    forwardRef(() => FollowersPanelComponent),
    forwardRef(() => PetsPanelComponent),
    forwardRef(() => FarmPanelComponent),
    forwardRef(() => LocationPanelComponent),
    forwardRef(() => ImpossibleTaskPanelComponent),
    forwardRef(() => TechniquePanelComponent),
    forwardRef(() => CraftingPanelComponent),
    forwardRef(() => HellStatusPanelComponent),
    forwardRef(() => ContemplationPanelComponent),
    forwardRef(() => DivineDuelsPanelComponent),
    forwardRef(() => TooltipDirective),
    forwardRef(() => NgClass),
  ],
  templateUrl: './mobile-panel-wrapper.component.html',
  styleUrl: './mobile-panel-wrapper.component.less',
})
export class MobilePanelWrapperComponent implements OnInit {
  protected readonly gameStateService = inject(GameStateService);
  readonly panelId = input.required<string>();
  panel: Panel | undefined = undefined;

  ngOnInit(): void {
    this.panel = this.gameStateService.getPanel(this.panelId());
  }
}

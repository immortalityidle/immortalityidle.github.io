import { Component } from '@angular/core';
import { MobileHealthComponent } from './mobile-health/mobile-health.component';
import { MobileActivitiesComponent } from './mobile-activities/mobile-activities.component';
import { MobileTimeComponent } from './mobile-time/mobile-time.component';
import { MobileTimeButtonsComponent } from './mobile-time-buttons/mobile-time-buttons.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileDrawerComponent } from './mobile-drawer/mobile-drawer.component';

@Component({
  selector: 'app-mobile-layout',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MobileHealthComponent,
    MobileActivitiesComponent,
    MobileTimeComponent,
    MobileTimeButtonsComponent,
    MobileDrawerComponent,
  ],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.less',
})
export class MobileLayoutComponent {}

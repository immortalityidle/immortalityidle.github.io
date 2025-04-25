import { Component } from '@angular/core';
import { MobileHealthComponent } from './mobile-health/mobile-health.component';
import { MobileActivitiesComponent } from './mobile-activities/mobile-activities.component';
import { MobileTimeComponent } from './mobile-time/mobile-time.component';

@Component({
  selector: 'app-mobile-layout',
  imports: [MobileHealthComponent, MobileActivitiesComponent, MobileTimeComponent],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.less',
})
export class MobileLayoutComponent {}

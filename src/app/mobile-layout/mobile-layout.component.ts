import { Component } from '@angular/core';
import { MobileHealthComponent } from './mobile-health/mobile-health.component';
import { MobileTimeButtonsComponent } from './mobile-time-buttons/mobile-time-buttons.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MobileDrawerComponent } from './mobile-drawer/mobile-drawer.component';
import { MobileWidgetCarouselComponent } from './mobile-widget-carousel/mobile-widget-carousel.component';

@Component({
  selector: 'app-mobile-layout',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MobileHealthComponent,
    MobileTimeButtonsComponent,
    MobileDrawerComponent,
    MobileWidgetCarouselComponent,
  ],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.less',
})
export class MobileLayoutComponent {}

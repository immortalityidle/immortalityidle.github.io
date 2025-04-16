import { Component } from '@angular/core';
import { MobileHealthComponent } from './mobile-health/mobile-health.component';

@Component({
  selector: 'app-mobile-layout',
  imports: [MobileHealthComponent],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.less',
})
export class MobileLayoutComponent {}

import { Component, forwardRef } from '@angular/core';
import { LocationService, LocationType } from '../game-state/location.service';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-location-panel',
  imports: [forwardRef(() => MatIcon), forwardRef(() => TooltipDirective)],
  templateUrl: './location-panel.component.html',
  styleUrl: './location-panel.component.less',
})
export class LocationPanelComponent {
  locationTypeSelf = LocationType.Self;

  constructor(public locationService: LocationService) {}

  locationClicked(location: LocationType) {
    this.locationService.setLocation(location);
  }
}

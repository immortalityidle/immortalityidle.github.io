import { Component, forwardRef } from '@angular/core';
import { LocationService } from '../game-state/location.service';
import { LocationType } from '../game-state/activity';
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
    if (this.locationService.troubleTarget === location) {
      this.locationService.troubleTarget = null;
    } else {
      this.locationService.troubleTarget = location;
    }
  }
}

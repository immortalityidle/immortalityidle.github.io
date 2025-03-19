import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-achievement-panel',
  templateUrl: './achievement-panel.component.html',
  styleUrls: ['./achievement-panel.component.less'],
  imports: [TooltipDirective],
})
export class AchievementPanelComponent {
  constructor(public achievementService: AchievementService) {}
}

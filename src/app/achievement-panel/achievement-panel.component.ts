import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';

@Component({
  selector: 'app-achievement-panel',
  templateUrl: './achievement-panel.component.html',
  styleUrls: ['./achievement-panel.component.less'],
  standalone: false,
})
export class AchievementPanelComponent {
  constructor(public achievementService: AchievementService) {}
}

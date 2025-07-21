import { Component, forwardRef } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { CamelToTitlePipe } from '../pipes';

@Component({
  selector: 'app-memories-panel',
  templateUrl: './memories-panel.component.html',
  styleUrl: './memories-panel.component.less',
  imports: [forwardRef(() => CamelToTitlePipe)],
})
export class MemoriesPanelComponent {
  constructor(public achievementService: AchievementService) {}
}

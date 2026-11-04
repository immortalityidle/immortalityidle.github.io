import { Component, forwardRef } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { CamelToTitlePipe } from '../pipes';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-memories-panel',
  templateUrl: './memories-panel.component.html',
  styleUrl: './memories-panel.component.less',
  imports: [forwardRef(() => CamelToTitlePipe), MatIcon, MatDialogClose],
})
export class MemoriesPanelComponent {
  constructor(public achievementService: AchievementService) {}
}

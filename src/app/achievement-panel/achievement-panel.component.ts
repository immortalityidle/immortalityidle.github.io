import { Component, forwardRef } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { NgClass } from '@angular/common';
import { MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-achievement-panel',
  templateUrl: './achievement-panel.component.html',
  styleUrls: ['./achievement-panel.component.less'],
  imports: [forwardRef(() => TooltipDirective), forwardRef(() => NgClass), MatDialogClose, MatIcon],
})
export class AchievementPanelComponent {
  constructor(public achievementService: AchievementService) {}
}

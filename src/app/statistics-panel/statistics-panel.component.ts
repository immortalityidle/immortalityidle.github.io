import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { ActivityService } from '../game-state/activity.service';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';
import { FollowersService } from '../game-state/followers.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { StoreService } from '../game-state/store.service';

@Component({
  selector: 'app-statistics-panel',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.less'],
})
export class StatisticsPanelComponent {
  lastTimestamp = new Date().getTime();
  daysPerSecond = 0;
  lastTickTotal = 0;
  skipCount = 9;
  constructor(
    public mainLoopService: MainLoopService,
    public storeService: StoreService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public followerService: FollowersService,
    public characterService: CharacterService,
    public battleService: BattleService,
    public activityService: ActivityService,
    public achievementService: AchievementService
  ) {
    this.lastTickTotal = mainLoopService.totalTicks;
    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.skipCount >= 10) {
        this.skipCount = 0;
      } else {
        this.skipCount++;
        return;
      }
      const currentTimestamp = new Date().getTime();
      const timeDiff = (currentTimestamp - this.lastTimestamp) / 1000;
      const tickDiff = this.mainLoopService.totalTicks - this.lastTickTotal;
      if (timeDiff !== 0) {
        this.daysPerSecond = tickDiff / timeDiff;
      }
      this.lastTickTotal = this.mainLoopService.totalTicks;
      this.lastTimestamp = currentTimestamp;
    });
  }
}

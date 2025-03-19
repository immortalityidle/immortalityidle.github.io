import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { ActivityService } from '../game-state/activity.service';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';
import { FollowersService } from '../game-state/followers.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { StatisticsService } from '../game-state/statistics.service';
import { StoreService } from '../game-state/store.service';
import { ActivityType } from '../game-state/activity';
import { FarmService } from '../game-state/farm.service';

@Component({
  selector: 'app-statistics-panel',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.less'],
  standalone: false,
})
export class StatisticsPanelComponent {
  constructor(
    public mainLoopService: MainLoopService,
    public storeService: StoreService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public farmService: FarmService,
    public followerService: FollowersService,
    public characterService: CharacterService,
    public battleService: BattleService,
    public activityService: ActivityService,
    public achievementService: AchievementService,
    public statisticsService: StatisticsService
  ) {}

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  getActivityName(key: string) {
    return this.activityService.getActivityName(parseInt(key) as ActivityType);
  }
}

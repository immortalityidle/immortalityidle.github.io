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

@Component({
  selector: 'app-statistics-panel',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.less'],
})
export class StatisticsPanelComponent {
  constructor(
    public mainLoopService: MainLoopService,
    public storeService: StoreService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public followerService: FollowersService,
    public characterService: CharacterService,
    public battleService: BattleService,
    public activityService: ActivityService,
    public achievementService: AchievementService,
    public statisticsService: StatisticsService,
  ) {
  }
}

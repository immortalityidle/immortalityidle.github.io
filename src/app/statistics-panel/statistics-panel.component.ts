import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./statistics-panel.component.less']
})
export class StatisticsPanelComponent implements OnInit {

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
      if (this.skipCount >= 10){
        this.skipCount = 0;
      } else {
        this.skipCount++;
        return;
      }
      let currentTimestamp = new Date().getTime();
      let timeDiff = (currentTimestamp - this.lastTimestamp) / 1000;
      let tickDiff = this.mainLoopService.totalTicks - this.lastTickTotal;
      if (timeDiff != 0){
        this.daysPerSecond = tickDiff / timeDiff;
      }
      this.lastTickTotal = this.mainLoopService.totalTicks;
      this.lastTimestamp = currentTimestamp;
    });    
  }

/*
homeService:
  land: number; - add most
  landPrice: number; - add highest
  fields: Field[] = []; - add most
  averageYield = 0; - add highest
  add highest home owned
followerService:
  add total ever recruited, died, dismissed, highest level,
character:
  add highest money, best attack, best defense, accuracy, highest age, lifespan, health, stamina, mana
battleService:
  add most damage taken, most damage dealt, damage blocked, 
activityService:
  add total exhaustionDays
  add jobs mastered
  add day counts for all jobs
*/

  ngOnInit(): void {
  }

}

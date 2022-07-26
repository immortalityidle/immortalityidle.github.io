import { Component, OnInit } from '@angular/core';
import { MainLoopService } from '../game-state/main-loop.service';

@Component({
  selector: 'app-statistics-panel',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.less']
})
export class StatisticsPanelComponent implements OnInit {

  constructor(
    public mainLoopService: MainLoopService
  ) { }

/*
storeService: 
  manuals - manuals discovered
inventoryService: 
  maxItems = 10;
  autoSellEntries: AutoItemEntry[];
  autoUseEntries: AutoItemEntry[];
  autoBalanceItems: BalanceItem[];
  lifetimeUsedItems = 0;
  lifetimeSoldItems = 0;
  lifetimePotionsUsed = 0;
  lifetimePillsUsed = 0;
  lifetimeGemsSold = 0;
  thrownAwayItems = 0;
  mergeCounter = 0;
homeService:
  land: number; - add most
  landPrice: number; - add highest
  fields: Field[] = []; - add most
  averageYield = 0; - add highest
  add highest home owned
followerService:
  followers: Follower[] = [];
  followersRecruited = 0;
  followerCap = 0;
  add total ever recruited, died, dismissed, highest level,
character:
  totalLives = 1;
  add highest money, best attack, best defense, accuracy, highest age, lifespan, health, stamina, mana
battleService:
  kills: number;
  troubleKills: number;
  highestGem = 0;
  add most damage taken, most damage dealt, damage blocked, 
activityService:
  openApprenticeships = 1;
  oddJobDays = 0;
  beggingDays = 0;
  add total exhaustionDays
  add jobs mastered
  add day counts for all jobs
achievementService:
  unlockedAchievements
*/

  ngOnInit(): void {
  }

}

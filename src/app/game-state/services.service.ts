import { Injectable, Injector } from '@angular/core';
import { AchievementService } from './achievement.service';
import { ActivityService } from './activity.service';
import { AutoBuyerService } from './autoBuyer.service';
import { BattleService } from './battle.service';
import { CharacterService } from './character.service';
import { FollowersService } from './followers.service';
import { GameStateService } from './game-state.service';
import { HellService } from './hell.service';
import { HomeService } from './home.service';
import { ImpossibleTaskService } from './impossibleTask.service';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  public achievementService!: AchievementService;
  public activityService!: ActivityService;
  public autoBuyerService!: AutoBuyerService;
  public battleService!: BattleService;
  public characterService!: CharacterService;
  public followerService!: FollowersService;
  public gameStateService!: GameStateService;
  public hellService!: HellService;
  public homeService!: HomeService;
  public impossibleTaskService!: ImpossibleTaskService;
  public inventoryService!: InventoryService;
  public itemRepoService!: ItemRepoService;
  public logService!: LogService;
  public mainLoopService!: MainLoopService;
  public reincarnationService!: ReincarnationService;
  public storeService!: StoreService;

  constructor(private injector: Injector) {}

  init(): void {
    this.mainLoopService = this.injector.get(MainLoopService);
    this.logService = this.injector.get(LogService).init();
    this.reincarnationService = this.injector.get(ReincarnationService);
    this.characterService = this.injector.get(CharacterService).init();
    this.itemRepoService = this.injector.get(ItemRepoService).init();
    this.achievementService = this.injector.get(AchievementService).init();
    this.activityService = this.injector.get(ActivityService).init();
    this.battleService = this.injector.get(BattleService).init();
    this.followerService = this.injector.get(FollowersService).init();
    this.gameStateService = this.injector.get(GameStateService).init();
    this.hellService = this.injector.get(HellService).init();
    this.inventoryService = this.injector.get(InventoryService).init();
    this.homeService = this.injector.get(HomeService).init();
    this.impossibleTaskService = this.injector.get(ImpossibleTaskService).init();
    this.storeService = this.injector.get(StoreService);
    this.autoBuyerService = this.injector.get(AutoBuyerService).init();
  }
}

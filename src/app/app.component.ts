import { Component, OnInit, OnDestroy, HostListener, viewChild, inject } from '@angular/core';
import { GameStateService } from './game-state/game-state.service';
import { MainLoopService } from './game-state/main-loop.service';
import { CharacterService } from './game-state/character.service';
import { StatisticsService } from './game-state/statistics.service';
import { HomeService } from './game-state/home.service';
import { InventoryService } from './game-state/inventory.service';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FarmService } from './game-state/farm.service';
import { MobileLayoutComponent } from './mobile-layout/mobile-layout.component';
import { StandardLayoutComponent } from './standard-layout/standard-layout.component';
import { AppService } from './app.service';

const mobileBreakpoint = 500;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  imports: [MobileLayoutComponent, StandardLayoutComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  protected appService = inject(AppService);

  protected standardLayout = viewChild(StandardLayoutComponent);
  protected mobileLayout = viewChild(MobileLayoutComponent);

  private resizeSubscription?: Subscription;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.mainLoopService.pause = !this.mainLoopService.pause;
      event.preventDefault();
    } else if ((event.code === 'Enter' || event.code === 'NumpadEnter') && this.mainLoopService.pause) {
      this.mainLoopService.tick();
      event.preventDefault();
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit0' || event.code === 'Numpad0')) {
      this.mainLoopService.pause = true;
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit1' || event.code === 'Numpad1')) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 40;
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit2' || event.code === 'Numpad2')) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 10;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit3' || event.code === 'Numpad3') &&
      this.mainLoopService.unlockFastSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 5;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit4' || event.code === 'Numpad4') &&
      this.mainLoopService.unlockFasterSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 2;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit5' || event.code === 'Numpad5') &&
      this.mainLoopService.unlockFastestSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 1;
    }
  }

  constructor(
    private mainLoopService: MainLoopService,
    private gameStateService: GameStateService,
    // Note: Most of these are not used here, but I'm afraid to remove because they looks like the constructor might need to be called immediately on load?
    // TODO: This seems weird to inject this here, but not use it. :/
    public statisticsService: StatisticsService, // Want to start this ASAP so we start getting statistics immediately.
    public characterService: CharacterService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public farmService: FarmService
  ) {}

  private isMobileWidth(): boolean {
    return window.innerWidth < mobileBreakpoint;
  }

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();

    this.resizeSubscription = merge(fromEvent(window, 'resize'), fromEvent(window, 'orientationchange'))
      .pipe(debounceTime(50))
      .subscribe(() => {
        const standardLayout = this.standardLayout();
        if (standardLayout) {
          standardLayout.grid().resize();
        }

        if (this.isMobileWidth()) {
          this.appService.isMobile.set(true);
        } else {
          this.appService.isMobile.set(false);
        }
      });
    this.appService.isMobile.set(this.isMobileWidth());
  }

  ngOnDestroy() {
    this.resizeSubscription?.unsubscribe();
  }
}

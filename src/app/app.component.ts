import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  Pipe,
  PipeTransform,
  ViewChild,
  HostListener,
  forwardRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService, Panel } from './game-state/game-state.service';
import { MainLoopService } from './game-state/main-loop.service';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { StoreModalComponent } from './store-modal/store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { StoreService } from './game-state/store.service';
import { CharacterService } from './game-state/character.service';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';
import { ImpossibleTaskService } from './game-state/impossibleTask.service';
import { ImpossibleTaskPanelComponent } from './impossible-task-panel/impossible-task-panel.component';
import { environment } from '../environments/environment';
import { TutorialPanelComponent } from './tutorial-panel/tutorial-panel.component';
import { ChangelogPanelComponent } from './changelog-panel/changelog-panel.component';
import { StatisticsPanelComponent } from './statistics-panel/statistics-panel.component';
import { HellService } from './game-state/hell.service';
import { StatisticsService } from './game-state/statistics.service';
import { ViewportScroller, DOCUMENT, NgClass } from '@angular/common';
import { FollowersService } from './game-state/followers.service';
import { HomeService } from './game-state/home.service';
import { InventoryService } from './game-state/inventory.service';
import {
  KtdGridComponent,
  KtdGridLayout,
  KtdGridLayoutItem,
  ktdTrackById,
  KtdGridItemComponent,
  KtdGridDragHandle,
} from '@katoid/angular-grid-layout';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FarmService } from './game-state/farm.service';
import { MatIcon } from '@angular/material/icon';
import { TimePanelComponent } from './time-panel/time-panel.component';
import { AttributesPanelComponent } from './attributes-panel/attributes-panel.component';
import { HealthPanelComponent } from './health-panel/health-panel.component';
import { ActivityPanelComponent } from './activity-panel/activity-panel.component';
import { BattlePanelComponent } from './battle-panel/battle-panel.component';
import { EquipmentPanelComponent } from './equipment-panel/equipment-panel.component';
import { HomePanelComponent } from './home-panel/home-panel.component';
import { InventoryPanelComponent } from './inventory-panel/inventory-panel.component';
import { LogPanelComponent } from './log-panel/log-panel.component';
import { PortalPanelComponent } from './portal-panel/portal-panel.component';
import { FollowersPanelComponent } from './followers-panel/followers-panel.component';
import { PetsPanelComponent } from './pets-panel/pets-panel.component';
import { FarmPanelComponent } from './farm-panel/farm-panel.component';
import { TooltipDirective } from './tooltip/tooltip.directive';
import { LocationPanelComponent } from './location-panel/location-panel.component';

@Pipe({ name: 'floor' })
export class FloorPipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {number}
   */
  transform(value: number): number {
    return Math.floor(value);
  }
}

@Pipe({ name: 'camelToTitle' })
export class CamelToTitlePipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: string): string {
    value = value.split(/(?=[A-Z])/).join(' ');
    value = value[0].toUpperCase() + value.slice(1);
    return value;
  }
}

@Pipe({ name: 'bigNumber' })
export class BigNumberPipe implements PipeTransform {
  constructor(public mainLoopService: MainLoopService) {}

  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: number): string {
    if (!this.mainLoopService.scientificNotation) {
      let unsignedValue = value;
      let returnValue = '';
      if (value < 0) {
        unsignedValue = 0 - value;
      }
      const suffixArray = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's'];
      if (unsignedValue < 100 && !Number.isInteger(unsignedValue)) {
        returnValue = unsignedValue.toFixed(2) + '';
      } else if (unsignedValue < 10000) {
        returnValue = Math.round(unsignedValue) + '';
      } else if (unsignedValue >= Math.pow(10, suffixArray.length * 3)) {
        returnValue = unsignedValue.toPrecision(3);
      } else {
        const numberPower = Math.floor(Math.log10(unsignedValue));
        const numStr = Math.floor(unsignedValue / Math.pow(10, numberPower - (numberPower % 3) - 2)) / 100;
        returnValue = numStr + suffixArray[Math.floor(numberPower / 3)];
      }
      if (value < 0) {
        return '-' + returnValue;
      } else {
        return returnValue;
      }
    } else {
      return value.toPrecision(3);
    }
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => KtdGridComponent),
    forwardRef(() => KtdGridItemComponent),
    forwardRef(() => KtdGridDragHandle),
    forwardRef(() => TimePanelComponent),
    forwardRef(() => AttributesPanelComponent),
    forwardRef(() => HealthPanelComponent),
    forwardRef(() => ActivityPanelComponent),
    forwardRef(() => BattlePanelComponent),
    forwardRef(() => EquipmentPanelComponent),
    forwardRef(() => HomePanelComponent),
    forwardRef(() => InventoryPanelComponent),
    forwardRef(() => LogPanelComponent),
    forwardRef(() => PortalPanelComponent),
    forwardRef(() => FollowersPanelComponent),
    forwardRef(() => PetsPanelComponent),
    forwardRef(() => FarmPanelComponent),
    forwardRef(() => LocationPanelComponent),
    forwardRef(() => TooltipDirective),
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  // @ts-expect-error: no initializer
  @ViewChild(KtdGridComponent, { static: true }) grid: KtdGridComponent;
  panels: Panel[];
  resizingPanel = -1;
  previousX = 0;
  previousY = 0;

  title = 'immortalityidle';
  applicationVersion = environment.appVersion;

  activateSliders = false;

  private resizeSubscription: Subscription;
  trackById = ktdTrackById;
  gridGap = 4;
  mobileDevice = window.navigator.maxTouchPoints > 0;
  compactType: 'vertical' | 'horizontal' | null = 'vertical';
  /*
  window.matchMedia('(max-width: 700px)').matches
    ? 'vertical'
    : 'horizontal';
*/
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
  /*
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.compactType = window.matchMedia('(max-width: 700px)').matches ? 'vertical' : 'horizontal';
  }
*/
  constructor(
    private scroller: ViewportScroller,
    public mainLoopService: MainLoopService,
    public gameStateService: GameStateService,
    public followersService: FollowersService,
    public statisticsService: StatisticsService, // Want to start this ASAP so we start getting statistics immediately.
    public storeService: StoreService,
    public characterService: CharacterService,
    public impossibleTaskService: ImpossibleTaskService,
    public hellService: HellService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public farmService: FarmService,
    public dialog: MatDialog,
    @Inject(DOCUMENT) public document: Document
  ) {
    this.resizeSubscription = new Subscription();
    this.panels = this.gameStateService.panels;
  }

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();

    this.resizeSubscription = merge(fromEvent(window, 'resize'), fromEvent(window, 'orientationchange'))
      .pipe(debounceTime(50))
      .subscribe(() => {
        this.grid.resize();
      });
  }

  ngOnDestroy() {
    this.resizeSubscription.unsubscribe();
  }

  storeClicked(): void {
    this.dialog.open(StoreModalComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  manualStoreClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  optionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  impossibleTasksClicked() {
    this.dialog.open(ImpossibleTaskPanelComponent, {
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  lockPanelsToggle() {
    this.gameStateService.lockPanels = !this.gameStateService.lockPanels;
  }

  onLayoutUpdated(layout: KtdGridLayout) {
    this.gameStateService.layout = layout;
    // always save when the player moves the windows around
    this.gameStateService.savetoLocalStorage();
  }

  /*
  onBodyMouseMove(event: MouseEvent) {
    if (this.gameStateService.dragging) {
      return;
    }
    if (event.buttons !== 1) {
      return;
    }
    const x = this.scroller.getScrollPosition()[0] - event.movementX;
    const y = this.scroller.getScrollPosition()[1] - event.movementY;
    this.scroller.scrollToPosition([x, y]);
  }
*/
  getPanel(layoutPanel: KtdGridLayoutItem) {
    for (const panel of this.gameStateService.panels) {
      if (panel.id === layoutPanel.id) {
        return panel;
      }
    }
    return {
      id: 'undefinedPanel',
      name: '',
      icon: '',
      panelHelp: '',
    };
  }

  nextPanelClick(index: number) {
    this.gameStateService.changeLayoutPanel(index);
  }

  previousPanelClick(index: number) {
    this.gameStateService.changeLayoutPanel(index, true);
  }

  closePanelClick(index: number) {
    this.gameStateService.removeLayoutPanel(index);
  }
}

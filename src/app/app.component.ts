import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService, PanelIndex } from './game-state/game-state.service';
import { MainLoopService } from './game-state/main-loop.service';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { HostListener } from '@angular/core';
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
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { ViewportScroller } from '@angular/common';
import { FollowersService } from './game-state/followers.service';

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
      const suffixArray = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's'];
      if (value < 100 && !Number.isInteger(value)) {
        return value.toFixed(2) + '';
      } else if (value < 10000) {
        return Math.round(value) + '';
      } else if (value >= Math.pow(10, suffixArray.length * 3)) {
        return value.toPrecision(3);
      } else {
        const numberPower = Math.floor(Math.log10(value));
        const numStr = Math.floor(value / Math.pow(10, numberPower - (numberPower % 3) - 2)) / 100;
        return numStr + suffixArray[Math.floor(numberPower / 3)];
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
})
export class AppComponent implements OnInit {
  doingPanelDrag = false;
  panelIndex: typeof PanelIndex = PanelIndex;
  resizingPanel = -1;

  title = 'immortalityidle';
  applicationVersion = environment.appVersion;

  activateSliders = false;

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
    private scroller: ViewportScroller,
    private mainLoopService: MainLoopService,
    public gameStateService: GameStateService,
    public followersService: FollowersService,
    public statisticsService: StatisticsService, // Want to start this ASAP so we start getting statistics immediately.
    public storeService: StoreService,
    public characterService: CharacterService,
    public impossibleTaskService: ImpossibleTaskService,
    public hellService: HellService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();
    this.setPanelPositions();
  }

  dragStart(event: CdkDragStart, panelIndex: number) {
    this.doingPanelDrag = true;
    const originalZIndex = this.gameStateService.panelZIndex[panelIndex];
    for (const index in this.panelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      if (this.gameStateService.panelZIndex[index] > originalZIndex) {
        this.gameStateService.panelZIndex[index]--;
        this.gameStateService.panelZIndex[panelIndex]++;
      }
    }
    event.source.element.nativeElement.style.zIndex = this.gameStateService.panelZIndex[panelIndex] + '';
  }

  dragEnd(event: CdkDragEnd, panelIndex: number) {
    this.gameStateService.panelPositions[panelIndex].x = event.source.getFreeDragPosition().x;
    this.gameStateService.panelPositions[panelIndex].y = event.source.getFreeDragPosition().y;
    // always save when the player moves the windows around
    this.gameStateService.savetoLocalStorage();
    this.doingPanelDrag = false;
  }

  setPanelPositions() {
    for (const index in this.panelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      this.gameStateService.panelPositions[index] = {
        x: this.gameStateService.panelPositions[index].x,
        y: this.gameStateService.panelPositions[index].y,
      };
    }
  }

  onBodyDrag(event: MouseEvent) {
    if (this.doingPanelDrag) {
      return;
    }
    if (event.buttons !== 1) {
      this.doingPanelDrag = false;
      if (this.resizingPanel !== -1) {
        // just released a panel resize
        this.resizingPanel = -1;
        // always save when the player moves the windows around
        this.gameStateService.savetoLocalStorage();
      }
      return;
    }
    if (this.resizingPanel !== -1) {
      const newWidth = this.gameStateService.panelSizes[this.resizingPanel].x + event.movementX;
      this.gameStateService.panelSizes[this.resizingPanel].x = newWidth;
      const newHeight = this.gameStateService.panelSizes[this.resizingPanel].y + event.movementY;
      this.gameStateService.panelSizes[this.resizingPanel].y = newHeight;
      return;
    }

    if (event.target instanceof Element && event.target.classList.contains('panelResizeHandle')) {
      if (this.resizingPanel === -1) {
        if (event.target.parentElement) {
          this.resizingPanel = parseInt(event.target.parentElement.id);
        }
      }
    }
    if (event.target instanceof Element && event.target.classList.contains('bodyContainer')) {
      const x = this.scroller.getScrollPosition()[0] - event.movementX;
      const y = this.scroller.getScrollPosition()[1] - event.movementY;
      this.scroller.scrollToPosition([x, y]);
    }
  }

  storeClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  storeOptionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      width: '750px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  impossibleTasksClicked() {
    this.dialog.open(ImpossibleTaskPanelComponent, {
      width: '500px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}

import { Injectable, Injector, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CharacterService } from './character.service';
import { MatDialog } from '@angular/material/dialog';
import { BattleService } from './battle.service';

const TICK_INTERVAL_MS = 25;
const LONG_TICK_INTERVAL_MS = 500;
const DISPLAY_VALUE_INTERVAL_MS = 250;

export interface MainLoopProperties {
  unlockFastSpeed: boolean;
  unlockFasterSpeed: boolean;
  unlockFastestSpeed: boolean;
  unlockAgeSpeed: boolean;
  unlockPlaytimeSpeed: boolean;
  lastTime: number;
  tickDivider: number;
  offlineDivider: number;
  pause: boolean;
  bankedTicks: number;
  totalTicks: number;
  useBankedTicks: boolean;
  scientificNotation: boolean;
  playMusic: boolean;
  timeUnlocked: boolean;
  daysSinceLongTick: number;
  daysSinceYearOrLongTick: number;
}

@Injectable({
  providedIn: 'root',
})
export class MainLoopService {
  battleService?: BattleService;

  tickSubject = new Subject<number>();
  homeTickSubject = new Subject<number>();
  inventoryTickSubject = new Subject<number>();
  activityTickSubject = new Subject<number>();
  battleTickSubject = new Subject<number>();
  reincarnateSubject = new Subject<number>();
  doneReincarnatingSubject = new Subject<number>();

  /**
   * Only emits every 500ms and returns number of days that elapsed since
   * the previous tick of longTickSubject
   */
  longTickSubject = new Subject<number>();

  displayValueTickSubject = new Subject<void>();

  /**
   * Updates every year or every long tick, whichever comes first.
   * Emits the number of elapsed days (which must be <= 365).
   */
  yearOrLongTickSubject = new Subject<number>();

  pause = true;
  tickDivider = 10;
  tickCount = 0;
  totalTicks = 0;
  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;
  topDivider = 10;
  unlockAgeSpeed = false;
  unlockPlaytimeSpeed = false;
  lastTime: number = new Date().getTime();
  bankedTicks = 0;
  displayBankedTicks = signal<number>(0);
  offlineDivider = 10;
  characterService?: CharacterService;
  useBankedTicks = true;
  scientificNotation = false;
  earnedTicks = 0;
  playMusic = false;
  audio: HTMLAudioElement;
  timeUnlocked = false;
  importing = false;
  gameLoading = true;
  reincarnating = false;
  daysSinceLongTick = 0;
  daysSinceYearOrLongTick = 0;
  lastUsedTickTime = 0;

  constructor(private injector: Injector, public dialog: MatDialog) {
    setTimeout(() => (this.battleService = this.injector.get(BattleService)));

    this.audio = new Audio('./assets/music/Shaolin-Dub-Rising-Sun-Beat.mp3');
    this.audio.volume = 0.2;
    this.audio.loop = true;
  }

  getProperties(): MainLoopProperties {
    return {
      unlockFastSpeed: this.unlockFastSpeed,
      unlockFasterSpeed: this.unlockFasterSpeed,
      unlockFastestSpeed: this.unlockFastestSpeed,
      unlockAgeSpeed: this.unlockAgeSpeed,
      unlockPlaytimeSpeed: this.unlockPlaytimeSpeed,
      offlineDivider: this.offlineDivider,
      lastTime: this.lastTime,
      tickDivider: this.tickDivider,
      pause: this.pause,
      bankedTicks: this.bankedTicks,
      totalTicks: this.totalTicks,
      useBankedTicks: this.useBankedTicks,
      scientificNotation: this.scientificNotation,
      playMusic: this.playMusic,
      timeUnlocked: this.timeUnlocked,
      daysSinceLongTick: this.daysSinceLongTick,
      daysSinceYearOrLongTick: this.daysSinceYearOrLongTick,
    };
  }

  setProperties(properties: MainLoopProperties) {
    this.unlockFastSpeed = properties.unlockFastSpeed;
    this.unlockFasterSpeed = properties.unlockFasterSpeed;
    this.unlockFastestSpeed = properties.unlockFastestSpeed;
    this.topDivider = 10; // For earning bankedticks based on top divider.
    if (this.unlockFastestSpeed) {
      this.topDivider = 1;
    } else if (this.unlockFasterSpeed) {
      this.topDivider = 2;
    } else if (this.unlockFastSpeed) {
      this.topDivider = 5;
    }
    this.unlockAgeSpeed = properties.unlockAgeSpeed;
    this.unlockPlaytimeSpeed = properties.unlockPlaytimeSpeed;
    this.tickDivider = properties.tickDivider;
    this.offlineDivider = properties.offlineDivider;
    this.lastTime = properties.lastTime;
    const newTime = new Date().getTime();
    this.earnedTicks = (newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider);
    this.bankedTicks = properties.bankedTicks + this.earnedTicks;
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks;
    this.useBankedTicks = properties.useBankedTicks;
    this.scientificNotation = properties.scientificNotation;
    this.playMusic = properties.playMusic;
    this.timeUnlocked = properties.timeUnlocked;
    this.daysSinceLongTick = properties.daysSinceLongTick;
    this.daysSinceYearOrLongTick = properties.daysSinceYearOrLongTick;
    if (this.gameLoading) {
      this.pause = true;
      this.gameLoading = false;
    } else {
      this.pause = properties.pause;
    }
  }

  // audio also helps avoid getting deprioritized in the background.
  playAudio() {
    if (this.playMusic) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  start() {
    if (!this.characterService) {
      this.characterService = this.injector.get(CharacterService);
    }
    this.playAudio();

    setTimeout(() => this.handleTimeout(), TICK_INTERVAL_MS);
    setTimeout(() => this.handleLongTickTimeout(), LONG_TICK_INTERVAL_MS);
    setTimeout(() => this.handleDisplayValueTickTimeout(), DISPLAY_VALUE_INTERVAL_MS);
  }

  handleDisplayValueTickTimeout() {
    this.displayValueTickSubject.next();
    setTimeout(() => this.handleDisplayValueTickTimeout(), DISPLAY_VALUE_INTERVAL_MS);
  }

  handleLongTickTimeout() {
    this.longTickSubject.next(this.daysSinceLongTick);
    this.daysSinceLongTick = 0;
    this.yearOrLongTickSubject.next(this.daysSinceYearOrLongTick);
    this.daysSinceYearOrLongTick = 0;
    this.displayBankedTicks.set(this.bankedTicks);
    setTimeout(() => this.handleLongTickTimeout(), LONG_TICK_INTERVAL_MS);
  }

  handleTimeout() {
    const newTime = new Date().getTime();
    const timeDiff = newTime - this.lastTime;
    this.lastTime = newTime;
    this.bankedTicks += timeDiff / TICK_INTERVAL_MS;

    let ticksToDo = 0;
    if (this.useBankedTicks && !this.pause && this.tickDivider < 40) {
      ticksToDo = Math.floor(this.bankedTicks / this.tickDivider);
      if (ticksToDo > 10) {
        ticksToDo = 10;
      }
      this.bankedTicks -= ticksToDo * this.tickDivider;
    } else if (!this.pause && this.lastUsedTickTime < newTime - this.tickDivider * TICK_INTERVAL_MS) {
      this.bankedTicks -= this.tickDivider;
      ticksToDo = 1;
    }
    for (let i = 0; i < ticksToDo; i++) {
      this.tick();
      this.lastUsedTickTime = newTime;
    }
    setTimeout(() => this.handleTimeout(), TICK_INTERVAL_MS);
  }

  tick() {
    this.daysSinceLongTick++;
    this.daysSinceYearOrLongTick++;
    if (this.daysSinceYearOrLongTick >= 365) {
      this.yearOrLongTickSubject.next(this.daysSinceYearOrLongTick);
      this.daysSinceYearOrLongTick = 0;
    }
    if (this.battleService && this.battleService.enemies.length > 0) {
      this.battleTickSubject.next(1);
    } else {
      this.totalTicks++;
      this.inventoryTickSubject.next(1);
      this.activityTickSubject.next(1);
      this.homeTickSubject.next(1);
      this.tickSubject.next(1); // ticks character, followers, and hell
    }
    if (this.reincarnating) {
      this.reincarnateSubject.next(1);
      this.reincarnating = false;
      this.doneReincarnatingSubject.next(1);
    }
  }

  pauseClick() {
    if (this.pause) {
      this.tick();
    } else {
      this.pause = true;
    }
  }

  slowClick() {
    if (this.tickDivider === 40 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 40;
    }
  }

  standardClick() {
    if (this.tickDivider === 10 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 10;
    }
  }

  fastClick() {
    if (this.tickDivider === 5 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 5;
    }
  }

  fasterClick() {
    if (this.tickDivider === 2 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 2;
    }
  }

  fastestClick() {
    if (this.tickDivider === 1 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 1;
    }
  }
}

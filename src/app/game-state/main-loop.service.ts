import { Injectable, Injector, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CharacterService } from './character.service';
import { BattleService } from './battle.service';

const TICK_INTERVAL_MS = 25;

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
  audioTrack: number;
  audioVolume: number;
}

@Injectable({
  providedIn: 'root',
})
export class MainLoopService {
  longTickIntervalMS = 100;

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
  autopauseTriggered = false;
  nowPlaying = '';
  audioTracks = [
    'Sir Bastion - Chaos Of The West',
    'Sir Bastion - Cultivation Life',
    'Sir Bastion - Cultivators Lament',
    "Sir Bastion - Cultivator's Melancholy",
    'Sir Bastion - Defiance of Fate',
    'Sir Bastion - Defy The Heavens',
    'Sir Bastion - Face Tribulation Lightning',
    'Sir Bastion - Immortal Kingdom',
    "Sir Bastion - I've Learned to Fly",
    'Sir Bastion - Journey of 1000 Lives',
    'Sir Bastion - Mortal Longings',
    'Sir Bastion - Mountain In The Sky',
    'Sir Bastion - My Immortal Path',
    'Sir Bastion - Taught by A Dragon',
    'Sir Bastion - The Dragon Dance',
    'Sir Bastion - The Endless Path',
    "Sir Bastion - Young Immortal's Throne",
    'Shaolin Dub - Rising Sun Beat',
    'Shaolin Dub - Kick Dis',
    'Shaolin Dub - Conquests',
    'Shaolin Dub - Slap Trap',
  ];
  audioTrackIndex = 0;

  constructor(private injector: Injector) {
    setTimeout(() => (this.battleService = this.injector.get(BattleService)));

    this.audio = new Audio(this.audioTracks[0]);
    this.nowPlaying = this.audioTracks[0];
    this.audio.volume = 0.2;
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });
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
      audioTrack: this.audioTrackIndex,
      audioVolume: this.audio.volume,
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
    this.audio.volume = properties.audioVolume;
    this.audioTrackIndex = properties.audioTrack;
    this.playAudio();
  }

  // audio also helps avoid getting deprioritized in the background.
  playAudio() {
    if (this.playMusic) {
      this.audio.src = './assets/music/' + this.audioTracks[this.audioTrackIndex] + '.mp3';
      this.nowPlaying = this.audioTracks[this.audioTrackIndex];
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  start() {
    if (!this.characterService) {
      this.characterService = this.injector.get(CharacterService);
    }

    setTimeout(() => this.handleTimeout(), TICK_INTERVAL_MS);
    setTimeout(() => this.handleLongTickTimeout(), this.longTickIntervalMS);
  }

  handleLongTickTimeout() {
    this.longTickSubject.next(this.daysSinceLongTick);
    this.daysSinceLongTick = 0;
    this.yearOrLongTickSubject.next(this.daysSinceYearOrLongTick);
    this.daysSinceYearOrLongTick = 0;
    this.displayBankedTicks.set(this.bankedTicks);
    setTimeout(() => this.handleLongTickTimeout(), this.longTickIntervalMS);
  }

  handleTimeout() {
    const newTime = new Date().getTime();
    const timeDiff = newTime - this.lastTime;
    this.lastTime = newTime;
    this.bankedTicks += timeDiff / TICK_INTERVAL_MS;

    let ticksToDo = 0;
    if (!this.pause && this.lastUsedTickTime < newTime - this.tickDivider * TICK_INTERVAL_MS) {
      if (this.useBankedTicks && this.tickDivider < 40) {
        ticksToDo = Math.floor(20 / this.tickDivider);
        if (this.bankedTicks > this.tickDivider * ticksToDo) {
          this.bankedTicks -= this.tickDivider * ticksToDo;
        } else {
          ticksToDo = 1;
          this.bankedTicks -= this.tickDivider;
        }
      } else {
        this.bankedTicks -= this.tickDivider;
        ticksToDo = 1;
      }
    }
    for (let i = 0; i < ticksToDo; i++) {
      if (this.pause) {
        // some autopause stuff might make us pause in the middle of this loop, refund the unused ticks back to the bank
        this.bankedTicks += (ticksToDo - 1) * this.tickDivider;
        break;
      } else {
        this.tick();
        this.lastUsedTickTime = newTime;
      }
    }
    setTimeout(() => this.handleTimeout(), TICK_INTERVAL_MS);
  }

  tick() {
    if (this.battleService && this.battleService.enemies.length > 0) {
      this.battleTickSubject.next(1);
    } else {
      this.daysSinceLongTick++;
      this.daysSinceYearOrLongTick++;
      if (this.daysSinceYearOrLongTick >= 365) {
        this.yearOrLongTickSubject.next(this.daysSinceYearOrLongTick);
        this.daysSinceYearOrLongTick = 0;
      }

      this.totalTicks++;
      this.activityTickSubject.next(1);
      if (this.autopauseTriggered) {
        // autopause might have triggered, if so, don't do the rest of the tick
        this.autopauseTriggered = false;
        return;
      }
      this.inventoryTickSubject.next(1);
      this.homeTickSubject.next(1);
      this.tickSubject.next(1); // ticks character, followers, and hell
    }
    if (this.reincarnating) {
      this.reincarnateSubject.next(1);
      this.reincarnating = false;
      this.doneReincarnatingSubject.next(1);
    }
  }

  togglePause(pauseIt: boolean | null = null) {
    if (pauseIt !== null) {
      this.pause = !pauseIt;
    }
    if (this.pause) {
      this.pause = false;
      if (this.tickDivider === 1) {
        this.longTickIntervalMS = 500;
      } else if (this.tickDivider === 2) {
        this.longTickIntervalMS = 250;
      } else {
        this.longTickIntervalMS = 100;
      }
    } else {
      this.pause = true;
      this.longTickIntervalMS = 100;
    }
  }

  pauseClick() {
    if (this.pause) {
      this.tick();
    } else {
      this.pause = true;
      this.longTickIntervalMS = 100;
    }
  }

  slowClick() {
    if (this.tickDivider === 40 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 40;
    }
    this.longTickIntervalMS = 100;
  }

  standardClick() {
    if (this.tickDivider === 10 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 10;
    }
    this.longTickIntervalMS = 100;
  }

  fastClick() {
    if (this.tickDivider === 5 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 5;
    }
    this.longTickIntervalMS = 100;
  }

  fasterClick() {
    if (this.tickDivider === 2 && !this.pause) {
      this.pause = true;
      this.longTickIntervalMS = 100;
    } else {
      this.pause = false;
      this.tickDivider = 2;
      this.longTickIntervalMS = 250;
    }
  }

  fastestClick() {
    if (this.tickDivider === 1 && !this.pause) {
      this.pause = true;
    } else {
      this.pause = false;
      this.tickDivider = 1;
      this.longTickIntervalMS = 500;
    }
  }

  previousTrack() {
    this.audioTrackIndex--;
    if (this.audioTrackIndex < 0) {
      this.audioTrackIndex = this.audioTracks.length - 1;
    }
    this.playAudio();
  }

  nextTrack() {
    this.audioTrackIndex++;
    if (this.audioTrackIndex >= this.audioTracks.length) {
      this.audioTrackIndex = 0;
    }
    this.playAudio();
  }
}

import { Injectable, Injector } from '@angular/core';
//import { threadId } from 'worker_threads';
import { throttleTime, map, bufferCount, Subject, distinct, merge, OperatorFunction, filter } from 'rxjs'
import { CharacterService } from './character.service';
import { MatDialog } from '@angular/material/dialog';
import { OfflineModalComponent } from '../offline-modal/offline-modal.component';

const TICK_INTERVAL_MS = 25;
const LONG_TICK_INTERVAL_MS = 500;
const BACKGROUND_TICK_INTERVAL_MS = 1000;

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
}

@Injectable({
  providedIn: 'root',
})
export class MainLoopService {
  /**
   * Sends true on new day
   */
  tickSubject = new Subject<boolean>();

  /**
   * Sends every 25ms if in foreground or every second if in background.
   */
  frameSubject = new Subject<boolean>();

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
  offlineDivider = 10;
  characterService?: CharacterService;
  useBankedTicks = true;
  scientificNotation = false;
  earnedTicks = 0;
  playMusic = false;
  audio: HTMLAudioElement;

  constructor(private injector: Injector, public dialog: MatDialog) {
    this.audio = new Audio("./assets/music/Shaolin-Dub-Rising-Sun-Beat.mp3");
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
      playMusic: this.playMusic
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
    this.offlineDivider = properties.offlineDivider || 10;
    this.pause = properties.pause;
    this.lastTime = properties.lastTime;
    const newTime = new Date().getTime();
    if (newTime - this.lastTime > 168 * 60 * 60 * 1000) {
      // to diminish effects of forgetting about the game for a year and coming back with basically infinite ticks
      this.earnedTicks =
        (3 * 168 * 60 * 60 * 1000 + newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider * 4);
    } else {
      this.earnedTicks = (newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider);
    }
    this.bankedTicks = properties.bankedTicks + this.earnedTicks;
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks || 0;
    this.useBankedTicks = properties.useBankedTicks ?? true;
    this.scientificNotation = properties.scientificNotation || false;
    this.playMusic = properties.playMusic;
  }

  // audio also helps avoid getting deprioritized in the background.
  playAudio() {
    if (this.playMusic) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  };  

  start() {
    if (!this.characterService) {
      this.characterService = this.injector.get(CharacterService);
    }
    this.playAudio();

    type CancelFunc = () => void;
    const customSetInterval = (func: () => void, time: number): CancelFunc => {
      let isCancelled = false;
      let currentTimeout: CancelFunc = () => {};
      const cancelFunc = () => {
        isCancelled = true;
        if (currentTimeout !== null) {
          currentTimeout();
        }
      };

      const cancelFuncForSetTimeout = (timeoutKey: any) => () => clearTimeout(timeoutKey);

      const timeoutFunc = () => {
        if (isCancelled) {
          return;
        }

        const startTime = new Date();
        func();
        const endTime = new Date();
        const executionTime = endTime.getTime() - startTime.getTime();
        const timeToWait = time - executionTime;

        if (isCancelled) {
          return;
        }

        if (timeToWait <= 0) {
          currentTimeout = cancelFuncForSetTimeout(setTimeout(timeoutFunc, 0));
        } else {
          currentTimeout = cancelFuncForSetTimeout(setTimeout(timeoutFunc, timeToWait));
        }
      };

      currentTimeout = cancelFuncForSetTimeout(setTimeout(timeoutFunc, time));
      return cancelFunc;
    };

    const scheduleInterval = (func: () => void, desiredTime: number) => {
      if (desiredTime >= BACKGROUND_TICK_INTERVAL_MS) {
        customSetInterval(func, desiredTime);
      }

      const backgroundTimeTicks = Math.floor(BACKGROUND_TICK_INTERVAL_MS / desiredTime);

      let cancelCurrentTimer = () => {};
      const documentVisibilityChanged = () => {
        cancelCurrentTimer();

        if (document.hidden) {
          cancelCurrentTimer = customSetInterval(() => {
            for (let i = 0; i < backgroundTimeTicks; i++) {
              func();
            }
          }, BACKGROUND_TICK_INTERVAL_MS)
        } else {
          cancelCurrentTimer = customSetInterval(func, desiredTime);
        }
      };

      documentVisibilityChanged();
      document.addEventListener("visibilitychange", documentVisibilityChanged);
    };

    const trackTicksOp: OperatorFunction<any, number> = observable => {
      return observable.pipe(
        map(() => this.totalTicks),
        bufferCount(2, 1),
        map(totalTicksArr => totalTicksArr[1] - totalTicksArr[0])
      );
    };

    this.frameSubject.pipe(
      throttleTime(LONG_TICK_INTERVAL_MS),
      trackTicksOp
    ).subscribe(this.longTickSubject);

    let lastFireTime = Date.now();
    let lastFireDay = this.totalTicks;
    this.tickSubject.subscribe(() => {
      const currentTime = Date.now();
      if (currentTime - lastFireTime > LONG_TICK_INTERVAL_MS ||
        this.totalTicks - lastFireDay <= 365
        ) {
        this.yearOrLongTickSubject.next(this.totalTicks - lastFireDay);
        lastFireTime = currentTime;
        lastFireDay = this.totalTicks;
      }
    });

    scheduleInterval(() => {
      this.frameSubject.next(true);
    }, TICK_INTERVAL_MS);

    scheduleInterval(() => {
      const tickInterval = document.hidden ? BACKGROUND_TICK_INTERVAL_MS : TICK_INTERVAL_MS;
      const newTime = new Date().getTime();
      const timeDiff = newTime - this.lastTime;
      this.lastTime = newTime;
      // this should be around 1, but may vary based on browser throttling
      let ticksPassed = timeDiff / TICK_INTERVAL_MS;
      if (this.pause) {
        this.bankedTicks += ticksPassed / this.offlineDivider; // offlineDivider currently either 10 or 2.
      } else if (timeDiff > 900 * 1000) {
        // away for over 15 mins, push to offline ticks and display gains.
        const earnedTicks = ticksPassed / this.offlineDivider;
        this.bankedTicks += earnedTicks;
        this.dialog.open(OfflineModalComponent, {
          data: { earnedTicks: earnedTicks },
          autoFocus: false,
        });
      } else {
        const currentTPS = (this.getTPS(this.tickDivider) / 1000) * TICK_INTERVAL_MS;
        const topTPS = (this.getTPS(this.topDivider) / 1000) * TICK_INTERVAL_MS;
        let usedBanked = false;
        if (this.bankedTicks > 0 && this.useBankedTicks && this.tickDivider < 40) {
          // don't use banked ticks on slow speed
          //using banked ticks makes time happen 10 times faster
          let bankedPassed = ticksPassed * 10 * (currentTPS / topTPS); // reduce usage rate if going slower than max
          if (bankedPassed > this.bankedTicks) {
            // Check for not enough bankedTicks, usually for large timeDiff.
            bankedPassed = this.bankedTicks;
          }
          this.bankedTicks -= bankedPassed;
          ticksPassed *= 11; // Include the normal tick
          usedBanked = true;
        }
        ticksPassed *= currentTPS;

        this.tickCount += ticksPassed;
        let tickTime = new Date().getTime();
        while (!this.pause && this.tickCount >= 1 && tickTime < tickInterval + newTime) {
          this.tick();
          this.tickCount--;
          tickTime = new Date().getTime();
        }
        if (this.tickCount >= 1) {
          if (usedBanked) {
            this.bankedTicks += (this.tickCount / (currentTPS * 11)) * (10 * (currentTPS / topTPS));
          }
          this.tickCount = 0;
        }
      }
    }, TICK_INTERVAL_MS);
  }

  getTPS(div: number) {
    let ticksPassed = 1000 / TICK_INTERVAL_MS;
    if (this.characterService && this.unlockAgeSpeed && this.tickDivider < 40) {
      // don't do this on slow speed
      // 73000 is 200 years. reaches 2x at 600 years, 3x at 1600, 4x at 3000. Caps at 12600
      ticksPassed *= Math.min(8, Math.sqrt(1 + this.characterService.characterState.age / 73000));
    }
    if (this.unlockPlaytimeSpeed && this.tickDivider < 40) {
      // don't do this on slow speed
      ticksPassed *= Math.pow(1 + this.totalTicks / (2000 * 365), 0.3);
    }
    ticksPassed /= div;
    // make non-max speeds a bit more potent at high speeds
    const TICKSPEED_CAP = 40;
    if (div > 1 && ticksPassed > TICKSPEED_CAP) {
      if (div >= 10) {
        ticksPassed = TICKSPEED_CAP;
      } else {
        ticksPassed = TICKSPEED_CAP + (ticksPassed - TICKSPEED_CAP) / div;
      }
    }
    return ticksPassed;
  }

  tick() {
    this.totalTicks++;
    this.tickSubject.next(true);
  }
}

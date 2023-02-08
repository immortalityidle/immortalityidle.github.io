
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { OfflineModalComponent } from '../offline-modal/offline-modal.component';
import { ServicesService } from './services.service';

const TICK_INTERVAL_MS = 25;
const LONG_TICK_INTERVAL_MS = 500;

export interface MainLoopProperties {
  unlockFastSpeed: boolean,
  unlockFasterSpeed: boolean,
  unlockFastestSpeed: boolean,
  unlockAgeSpeed: boolean,
  unlockPlaytimeSpeed: boolean,
  lastTime: number;
  tickDivider: number;
  offlineDivider: number;
  pause: boolean;
  bankedTicks: number;
  totalTicks: number;
  useBankedTicks: boolean,
  scientificNotation: boolean
}

@Injectable({
  providedIn: 'root'
})
export class MainLoopService {
  /**
   * Sends true on new day
   */
  tickSubject = new Subject<boolean>();
  frameSubject = new Subject<boolean>();
  longTickSubject = new Subject<boolean>();
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
  useBankedTicks = true;
  scientificNotation = false;
  earnedTicks = 0;

  constructor(
    private services: ServicesService,
    public dialog: MatDialog
  ) {}

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
      scientificNotation: this.scientificNotation
    }
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
      this.earnedTicks = (3 * 168 * 60 * 60 * 1000 + newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider * 4);
    } else {
      this.earnedTicks = (newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider);
    }
    this.bankedTicks = properties.bankedTicks + this.earnedTicks;
    this.lastTime = newTime;
    this.totalTicks = properties.totalTicks || 0;
    this.useBankedTicks = properties.useBankedTicks ?? true;
    this.scientificNotation = properties.scientificNotation || false;
  }

  start() {
    window.setInterval(() => {
      this.longTickSubject.next(true);
    }, LONG_TICK_INTERVAL_MS);

    window.setInterval(() => {
      this.frameSubject.next(true);
    }, TICK_INTERVAL_MS);

    window.setInterval(() => {
      const newTime = new Date().getTime();
      const timeDiff = newTime - this.lastTime;
      this.lastTime = newTime;
      // this should be around 1, but may vary based on browser throttling
      let ticksPassed = timeDiff / TICK_INTERVAL_MS;
      if (this.pause) {
        this.bankedTicks += ticksPassed / this.offlineDivider; // offlineDivider currently either 10 or 2.
      } else if (timeDiff > 900 * 1000) { // away for over 15 mins, push to offline ticks and display gains.
        const earnedTicks = ticksPassed / this.offlineDivider;
        this.bankedTicks += earnedTicks;
        this.dialog.open(OfflineModalComponent, {
          data: { earnedTicks: earnedTicks },
          autoFocus: false
        });
      } else {
        const currentTPS = this.getTPS(this.tickDivider) / 1000 * TICK_INTERVAL_MS;
        const topTPS = this.getTPS(this.topDivider) / 1000 * TICK_INTERVAL_MS;
        let usedBanked = false;
        if (this.bankedTicks > 0 && this.useBankedTicks && this.tickDivider < 40) { // don't use banked ticks on slow speed
          //using banked ticks makes time happen 10 times faster
          let bankedPassed = ticksPassed * 10 * (currentTPS / topTPS); // reduce usage rate if going slower than max
          if (bankedPassed > this.bankedTicks) // Check for not enough bankedTicks, usually for large timeDiff.
          {
            bankedPassed = this.bankedTicks;
          }
          this.bankedTicks -= bankedPassed;
          ticksPassed *= 11; // Include the normal tick
          usedBanked = true;
        }
        ticksPassed *= currentTPS;

        this.tickCount += ticksPassed;
        let tickTime = new Date().getTime();
        while (!this.pause && this.tickCount >= 1 && tickTime < TICK_INTERVAL_MS + newTime) {
          this.tick();
          this.tickCount--;
          tickTime = new Date().getTime();
        }
        if (this.tickCount >= 1) {
          if (usedBanked) {
            this.bankedTicks += this.tickCount / (currentTPS * 11) * (10 * (currentTPS / topTPS));
          }
          this.tickCount = 0;
        }
      }
    }, TICK_INTERVAL_MS);
  }

  getTPS(div: number) {
    let ticksPassed = 1000 / TICK_INTERVAL_MS;
    if (this.services.characterService && this.unlockAgeSpeed && this.tickDivider < 40) { // don't do this on slow speed
      // 73000 is 200 years. reaches 2x at 600 years, 3x at 1600, 4x at 3000. Caps at 12600
      ticksPassed *= Math.min(8, Math.sqrt(1 + this.services.characterService.characterState.age / 73000));
    }
    if (this.unlockPlaytimeSpeed && this.tickDivider < 40) { // don't do this on slow speed
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

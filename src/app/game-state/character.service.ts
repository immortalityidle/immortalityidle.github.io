import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { Character, AttributeType } from './character';
import { ActivityService } from './activity.service';
import { Subscription } from 'rxjs';
import { BigNumberPipe } from '../app.component';
import { HellLevel, HellService } from './hell.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CamelToTitlePipe } from '../app.component';

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  camelToTitlePipe = new CamelToTitlePipe();
  bigNumberPipe: BigNumberPipe;
  activityService?: ActivityService;
  characterState: Character;
  forceRebirth = false;
  fatherGift = false;
  lifespanTooltip = '';
  deathSubscriber?: Subscription;
  hellService?: HellService;
  private snackBar: MatSnackBar;
  private snackBarObservable?: Subscription;

  constructor(
    private injector: Injector,
    private mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    public dialog: MatDialog
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    this.snackBar = this.injector.get(MatSnackBar);
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.characterState = new Character(logService, this.camelToTitlePipe, this.bigNumberPipe, mainLoopService, dialog);

    let prevTotalTicks = this.mainLoopService.totalTicks;
    mainLoopService.longTickSubject.subscribe(elapsedDays => {
      const currentTotalTicks = this.mainLoopService.totalTicks;
      const daysPerExtraDay = 3650;

      let extraDays = Math.floor(elapsedDays / daysPerExtraDay);
      if ((prevTotalTicks % daysPerExtraDay) > (currentTotalTicks % daysPerExtraDay)) {
        extraDays++;
      }

      if (extraDays > 0) {
        this.characterState.increaseBaseLifespan(extraDays, 70); //bonus day for living another 10 years, capped at 70 years
      }

      prevTotalTicks = currentTotalTicks;
    });

    mainLoopService.tickSubject.subscribe(() => {
      if (!this.characterState.dead) {
        this.characterState.age++;
        this.characterState.status.nourishment.value--;
      }
      // check for death
      let deathMessage = '';
      if (this.forceRebirth) {
        deathMessage = 'You release your soul from your body at the age of ' + this.formatAge() + '.';
      } else if (this.characterState.age >= this.characterState.lifespan && !this.characterState.immortal) {
        deathMessage =
          'You reach the end of your natural life and pass away from natural causes at the age of ' +
          this.formatAge() +
          '.';
      } else if (this.characterState.status.nourishment.value <= 0) {
        this.characterState.status.nourishment.value = 0;
        if (this.characterState.attributes.spirituality.value > 0) {
          // you're spritual now, you can fast!
          const starvationDamage = Math.max(this.characterState.status.health.value * 0.2, 20);
          this.logService.injury(LogTopic.COMBAT, 'You take ' + starvationDamage + ' damage from starvation.'); // it's not really a combat message, but I didn't want to spam the event log
          this.characterState.status.health.value -= starvationDamage;
          if (this.characterState.status.health.value < 0) {
            this.characterState.status.health.value = 0;
          }
          this.characterState.increaseAttribute('spirituality', 0.1);
          if (this.characterState.status.health.value <= 0) {
            if (!this.characterState.immortal) {
              deathMessage = 'You starve to death at the age of ' + this.formatAge() + '.';
            } else if (this.hellService?.inHell) {
              this.hellService.beaten = true;
            }
          }
        } else if (!this.characterState.immortal) {
          deathMessage = 'You starve to death at the age of ' + this.formatAge() + '.';
        }
      } else if (this.characterState.status.health.value <= 0 && !this.characterState.immortal) {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        if (this.activityService.activityDeath) {
          deathMessage = 'You die from overwork at the age of ' + this.formatAge() + '.';
        } else {
          deathMessage = 'You succumb to your wounds and die at the age of ' + this.formatAge() + '.';
        }
      } else if (this.characterState.immortal && this.characterState.status.health.value < 0) {
        this.characterState.status.health.value = 0;
      }
      if (deathMessage !== '') {
        if (!this.characterState.immortal) {
          this.logService.injury(LogTopic.EVENT, deathMessage);
          if (!this.forceRebirth) {
            this.logService.log(
              LogTopic.EVENT,
              "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
            );
          }
        }
        this.characterState.dead = true;
        if (!this.characterState.showLifeSummary) {
          this.toast('A new life begins.');
        }
        this.characterState.reincarnate(deathMessage); // make sure character reincarnation fires before other things reset
        this.reincarnationService.reincarnate();
        // Revive the character in the next tick update for making sure that everything is stopped.
        this.deathSubscriber = this.mainLoopService.tickSubject.subscribe(() => {
          this.characterState.dead = false;
          this.deathSubscriber?.unsubscribe();
        });
        this.forceRebirth = false;
        if (this.characterState.immortal) {
          this.logService.log(
            LogTopic.EVENT,
            'You are born anew, still an immortal but with the fresh vigor of youth.'
          );
        } else {
          this.logService.log(
            LogTopic.EVENT,
            'Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again. You are certain that lucky life number ' +
              this.characterState.totalLives +
              ' will be the one.'
          );
          this.logService.log(
            LogTopic.EVENT,
            "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!"
          );
        }
      }
    });

    mainLoopService.longTickSubject.subscribe(() => {
      if (this.characterState.highestMoney < this.characterState.money) {
        this.characterState.highestMoney = this.characterState.money;
      }
      if (this.characterState.highestAge < this.characterState.age) {
        this.characterState.highestAge = this.characterState.age;
      }
      if (this.characterState.highestHealth < this.characterState.status.health.value) {
        this.characterState.highestHealth = this.characterState.status.health.value;
      }
      if (this.characterState.highestStamina < this.characterState.status.stamina.value) {
        this.characterState.highestStamina = this.characterState.status.stamina.value;
      }
      if (this.characterState.highestMana < this.characterState.status.mana.value) {
        this.characterState.highestMana = this.characterState.status.mana.value;
      }

      if (this.characterState.dead) {
        return;
      }
      this.characterState.recalculateDerivedStats();
      if (
        this.hellService?.inHell &&
        this.hellService.currentHell === HellLevel.CrushingBoulder &&
        !this.hellService.completedHellTasks.includes(HellLevel.CrushingBoulder)
      ) {
        this.characterState.attackPower = 1;
      }
      this.setLifespanTooltip();
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      if (this.fatherGift && this.characterState.bloodlineRank < 6) {
        // Skip the family gifts, it's not thematic.
        this.logService.log(
          LogTopic.EVENT,
          'Your father puts some coins in your purse before sending you on your way.'
        );
        this.characterState.money += 200;
      }
    });
  }

  formatAge(): string {
    const years = Math.floor(this.characterState.age / 365);
    const days = this.characterState.age % 365;
    return years + ' years, ' + days + ' days';
  }

  setLifespanTooltip() {
    if (
      this.characterState.foodLifespan +
        this.characterState.alchemyLifespan +
        this.characterState.statLifespan +
        this.characterState.spiritualityLifespan +
        this.characterState.magicLifespan <=
      0
    ) {
      this.lifespanTooltip = 'You have done nothing to extend your lifespan.';
      return;
    }
    let tooltip = 'Your base lifespan of ' + this.yearify(this.characterState.baseLifespan) + ' is extended by';
    if (this.characterState.immortal) {
      tooltip =
        'You are immortal. If you had remained mortal, your base lifespan of ' +
        this.yearify(this.characterState.baseLifespan) +
        ' would be extended by';
    }
    if (this.characterState.foodLifespan > 0) {
      tooltip += '\nHealthy Food: ' + this.yearify(this.characterState.foodLifespan);
    }
    if (this.characterState.alchemyLifespan > 0) {
      tooltip += '\nAlchemy: ' + this.yearify(this.characterState.alchemyLifespan);
    }
    if (this.characterState.statLifespan > 0) {
      tooltip += '\nBasic Attributes: ' + this.yearify(this.characterState.statLifespan);
    }
    if (this.characterState.spiritualityLifespan > 0) {
      tooltip += '\nSpirituality: ' + this.yearify(this.characterState.spiritualityLifespan);
    }
    if (this.characterState.magicLifespan > 0) {
      tooltip += '\nMagic: ' + this.yearify(this.characterState.magicLifespan);
    }
    this.lifespanTooltip = tooltip;
  }

  yearify(value: number) {
    if (value < 365) {
      return '< 1 year';
    } else if (value < 730) {
      return '1 year';
    } else {
      return this.bigNumberPipe.transform(Math.floor(value / 365)) + ' years';
    }
  }

  resetAptitudes() {
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys) {
      const attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1 + attribute.aptitude / this.characterState.aptitudeGainDivider; // keep up to 20% of aptitudes after Ascension
      if (parseInt(key) < 5) {
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    if (!this.activityService) {
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
    this.activityService.activityLoop.splice(0, this.activityService.activityLoop.length);
    this.forceRebirth = true;
    this.mainLoopService.tick();
  }

  condenseSoulCore() {
    if (this.characterState.aptitudeGainDivider <= 5) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'Your spirituality coelesces around the core of your soul, strengthening it and reforging it into something stronger.'
    );
    this.logService.log(LogTopic.STORY, 'You now gain additional aptitude each time you reincarnate.');
    this.characterState.condenseSoulCoreCost *= 10;
    this.characterState.aptitudeGainDivider /= 1.5;
    this.resetAptitudes();
  }

  soulCoreRank(): number {
    return Math.log10(this.characterState.condenseSoulCoreCost / this.characterState.condenseSoulCoreOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  reinforceMeridians() {
    if (this.characterState.attributeScalingLimit >= 10240) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'The pathways that carry your chi through your body have been strengthened and reinforced.'
    );
    this.logService.log(LogTopic.STORY, 'Your aptitudes can now give you a greater increase when gaining attributes.');

    this.characterState.reinforceMeridiansCost *= 10;
    this.characterState.attributeScalingLimit *= 2;
    this.resetAptitudes();
  }

  meridianRank(): number {
    return Math.log10(this.characterState.reinforceMeridiansCost / this.characterState.reinforceMeridiansOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  upgradeBloodline() {
    if (this.characterState.bloodlineRank >= 9) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.'
    );
    this.logService.log(
      LogTopic.STORY,
      'You will be reborn into your own family line and reap greater benefits from your previous lives.'
    );
    this.characterState.bloodlineCost *= 100;
    this.characterState.bloodlineRank++;
    this.resetAptitudes();
  }

  stashWeapons() {
    this.characterState.stashedEquipment.rightHand = this.characterState.equipment.rightHand;
    this.characterState.stashedEquipment.leftHand = this.characterState.equipment.leftHand;
    this.characterState.equipment.rightHand = null;
    this.characterState.equipment.leftHand = null;
  }

  restoreWeapons() {
    this.characterState.equipment.rightHand = this.characterState.stashedEquipment.rightHand;
    this.characterState.equipment.leftHand = this.characterState.stashedEquipment.leftHand;
    this.characterState.stashedEquipment.rightHand = null;
    this.characterState.stashedEquipment.leftHand = null;
  }

  stashArmor() {
    this.characterState.stashedEquipment.head = this.characterState.equipment.head;
    this.characterState.stashedEquipment.body = this.characterState.equipment.body;
    this.characterState.stashedEquipment.legs = this.characterState.equipment.legs;
    this.characterState.stashedEquipment.feet = this.characterState.equipment.feet;
    this.characterState.equipment.head = null;
    this.characterState.equipment.body = null;
    this.characterState.equipment.legs = null;
    this.characterState.equipment.feet = null;
  }

  restoreArmor() {
    this.characterState.equipment.head = this.characterState.stashedEquipment.head;
    this.characterState.equipment.body = this.characterState.stashedEquipment.body;
    this.characterState.equipment.legs = this.characterState.stashedEquipment.legs;
    this.characterState.equipment.feet = this.characterState.stashedEquipment.feet;
    this.characterState.stashedEquipment.head = null;
    this.characterState.stashedEquipment.body = null;
    this.characterState.stashedEquipment.legs = null;
    this.characterState.stashedEquipment.feet = null;
  }

  stashMoney() {
    this.characterState.stashedMoney = this.characterState.money;
    this.characterState.money = 0;
  }

  restoreMoney() {
    this.characterState.money = this.characterState.stashedMoney;
    this.characterState.stashedMoney = 0;
  }

  // this doesn't really belong here, but nearly everything accesses this service and I didn't want to make a whole service for one function, so here it will live for now
  toast(message: string, duration = 5000) {
    const snackBar = this.snackBar.open(message, 'Close', {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackBar', 'darkMode'],
    });
    this.snackBarObservable = snackBar.onAction().subscribe(() => {
      this.snackBarObservable?.unsubscribe();
    });
  }
}

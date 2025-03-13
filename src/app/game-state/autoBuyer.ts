import { AutoBuyerService } from './autoBuyer.service';
import { CharacterService } from './character.service';
import { FarmService } from './farm.service';
import { HomeService } from './home.service';

export abstract class AutoBuyer {
  constructor(
    protected autoBuyerService: AutoBuyerService,
    protected homeService: HomeService,
    protected farmService: FarmService,
    protected characterService: CharacterService
  ) {}

  /**
   * Checks if permissions are correct to run this autobuyer.
   */
  abstract shouldRun(): boolean;

  /**
   * Performs the buying action for the autobuyer.
   * @param reserveAmount Passed in savings amount to prevent over-buying
   */
  abstract run(reserveAmount: number): void;

  /**
   * Returns true only if this autobuyer will never progress without another being run or an action being taken.
   * For example, if a furniture piece we need to buy is in a slot the house doesn't have
   */
  abstract isBlocked(): boolean;

  /**
   * Returns true only if the thing that prevents this autobuyer from running is time.
   * For example, when waiting for a house to finish upgrading so you can buy the next,
   * or a house is upgrading and will give a needed slot to furniture autobuy.
   */
  abstract isWaiting(): boolean;

  /**
   * Returns true if this autobuyer's work is complete
   */
  abstract isComplete(): boolean;
}

export class HomeAutoBuyer extends AutoBuyer {
  shouldRun(): boolean {
    return this.homeService.autoBuyHomeUnlocked;
  }

  run(reserveAmount: number) {
    // Don't buy land while upgrading.
    if (!this.homeService.upgrading) {
      //try to buy as much land as needed.
      const landRequired = Math.min(
        this.homeService.calculateAffordableLand(this.characterService.characterState.money - reserveAmount),
        this.homeService.nextHome.landRequired - this.homeService.land
      );
      if (landRequired > 0) {
        this.homeService.buyLand(landRequired);
      }
      // ... Unless there's a home after the next home.
    } else if (this.homeService.homeValue + 1 < this.homeService.autoBuyHomeLimit) {
      const nnHome = this.homeService.getHomeFromValue(this.homeService.nextHome.type + 1);
      if (nnHome && nnHome.landRequired > this.homeService.land) {
        const landRequired = Math.min(
          this.homeService.calculateAffordableLand(this.characterService.characterState.money - reserveAmount),
          nnHome.landRequired - this.homeService.land
        );
        if (landRequired > 0) {
          this.homeService.buyLand(landRequired);
        }
      }
    }

    if (!this.homeService.upgrading && this.homeService.land >= this.homeService.nextHome.landRequired) {
      if (this.characterService.characterState.money >= this.homeService.nextHomeCost + reserveAmount) {
        this.homeService.upgradeToNextHome();
      }
    }
  }

  isBlocked(): boolean {
    return false;
  }

  isWaiting(): boolean {
    // This autobuyer is waiting if the house is being upgraded and we already have the required land for the next home
    return this.homeService.upgrading && this.homeService.land >= this.homeService.nextHome.landRequired;
  }

  isComplete(): boolean {
    // We're complete if we've bought the last home upgrade, even if it isn't finished building
    return (
      this.homeService.homeValue >= this.homeService.autoBuyHomeLimit ||
      (this.homeService.upgrading && this.homeService.homeValue + 1 >= this.homeService.autoBuyHomeLimit)
    );
  }
}

export class LandAndFieldAutoBuyer extends AutoBuyer {
  shouldRun(): boolean {
    return this.homeService.autoBuyLandUnlocked || this.farmService.autoFieldUnlocked;
  }

  run(reserveAmount: number) {
    if (
      this.homeService.autoBuyLandUnlocked &&
      this.characterService.characterState.money >= this.homeService.landPrice + reserveAmount
    ) {
      const landRequired = Math.min(
        this.homeService.calculateAffordableLand(this.characterService.characterState.money - reserveAmount),
        this.homeService.autoBuyLandLimit -
          (this.homeService.land + this.farmService.fields.length + this.farmService.extraFields)
      );
      if (landRequired > 0) {
        this.homeService.buyLand(landRequired);
      }
    }

    if (this.farmService.autoFieldUnlocked) {
      const minFields = Math.min(
        this.homeService.land,
        this.farmService.autoFieldLimit - (this.farmService.fields.length + this.farmService.extraFields)
      );

      if (minFields > 0) {
        this.farmService.plowPlot(minFields);
      }
    }
  }

  isBlocked(): boolean {
    // This autobuyer can be blocked if it needs more fields, but we haven't unlocked buying land yet
    if (this.farmService.autoFieldUnlocked && !this.homeService.autoBuyLandUnlocked) {
      return (
        this.homeService.land === 0 &&
        this.farmService.fields.length + this.farmService.extraFields < this.farmService.autoFieldLimit
      );
    }

    return false;
  }

  isWaiting(): boolean {
    return false;
  }

  isComplete(): boolean {
    let landComplete = true;
    if (this.homeService.autoBuyLandUnlocked) {
      landComplete =
        this.homeService.land + this.farmService.fields.length + this.farmService.extraFields >=
        this.homeService.autoBuyLandLimit;
    }

    let fieldsComplete = true;
    if (this.farmService.autoFieldUnlocked) {
      fieldsComplete = this.farmService.fields.length + this.farmService.extraFields >= this.farmService.autoFieldLimit;
    }

    return landComplete && fieldsComplete;
  }
}

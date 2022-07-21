import { AutoPauserService } from "./autoPauser.service";
import { CharacterService } from "./character.service";

export abstract class AutoPauser {//TODO entire abstract class needs to be redesigned

  constructor(
    protected autoPauserService: AutoPauserService,
    protected characterService: CharacterService) {}

  /**
   * Checks if permissions are correct to run this autoPauser
   */
  abstract isEnabled(): boolean;

  /**
   * Performs the check
   * @param reserveAmount Passed in savings amount to prevent over-buying
   */
  abstract run(reserveAmount: number): void;

  /**
   * Checks if this autoPauser's condition is remotely reachable, for example, an immortal won't trigger a death nor lifespan autoPauser
   */
  abstract isPossible(): boolean;

  /**
   * Returns true only if the thing that prevents this autobuyer from running is time.
   * For example, when waiting for a house to finish upgrading so you can buy the next,
   * or a house is upgrading and will give a needed slot to furniture autobuy.
   */
  abstract isWaiting(): boolean;

}

//TODO replace autobuyer with autopausers (one of each possible type)
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
      )
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
        )
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
    return this.homeService.homeValue >= this.homeService.autoBuyHomeLimit
      || this.homeService.upgrading && (this.homeService.homeValue + 1 >= this.homeService.autoBuyHomeLimit);
  }
}

import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { Furniture, InventoryService, Item, instanceOfFurniture } from '../game-state/inventory.service';
import { HomeService, HomeType, Home } from '../game-state/home.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  manuals: Item[];
  furniture: Furniture[];
  selectedItem: Item | null;
  soulCoreRank: number = 0;
  meridianRank: number = 0;
  bloodlineLabel: string = "";
  bloodlineDescription: string = "";
  bloodLineHomeRequirement: Home = this.homeService.homesList[HomeType.Palace];

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    public homeService: HomeService,
    public dialog: MatDialog
  ) {
    this.selectedItem = null;

    this.manuals = [];
    for (let key in itemRepoService.items){
      let item = itemRepoService.items[key];
      if (item.type == 'manual'){
        this.manuals.push(itemRepoService.items[key]);
      }
    }
    this.furniture = [];

  }

  setStoreInventory(){
    this.furniture = [];
    for (let key in this.itemRepoService.furniture){
      let furniture = this.itemRepoService.furniture[key];
      if (this.homeService.home.furnitureSlots.includes(furniture.slot)){
        this.furniture.push(furniture);
      }
    }
    this.selectedItem = null;
  }

  buyManual(){
    if (this.selectedItem){
      if (this.selectedItem.value < this.characterService.characterState.money){
        this.characterService.characterState.money -= this.selectedItem.value;
        if (this.selectedItem.type == 'manual' && this.selectedItem.use){
          // use manuals immediately
          this.selectedItem.use();
        } else {
          this.inventoryService.addItem(this.selectedItem);
        }
      }
    }
  }

  buyFurniture(){
    if (this.selectedItem){
      if (!instanceOfFurniture(this.selectedItem)) {
        return;
      }
      let slot = this.selectedItem.slot;
      if (this.selectedItem.value < this.characterService.characterState.money){
        this.characterService.characterState.money -= this.selectedItem.value;
        this.homeService.furniture[slot] = this.selectedItem;
        this.homeService.autoBuyFurniture[slot] = this.selectedItem;
      }
    }
  }

  updateAscensions(){
    this.soulCoreRank = this.characterService.soulCoreRank();
    this.meridianRank = this.characterService.meridianRank();
    if (this.characterService.characterState.bloodlineRank == 0){
      this.bloodlineLabel = "Establish Bloodline";
    } else {
      this.bloodlineLabel = "Enhance Bloodline";
    }
    if (this.characterService.characterState.bloodlineRank == 0){
      this.bloodlineDescription = "Establish a bloodline. All of your future reincarnations will be born as your own descendants. Your weapons equipped on death will become family heirlooms and will be inherited by your future self.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Mansion];
    } else if (this.characterService.characterState.bloodlineRank == 1){
      this.bloodlineDescription = "Enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Palace];
    } else if (this.characterService.characterState.bloodlineRank == 2){
      this.bloodlineDescription = "Enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit some of your past self's money.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Castle];
    } else if (this.characterService.characterState.bloodlineRank == 3){
      this.bloodlineDescription = "Enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit your past self's money plus interest.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Fortress];
    } else if (this.characterService.characterState.bloodlineRank == 4){
      this.bloodlineDescription = "Enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit your past self's money plus interest. Your aptitudes extend your lifespan to a much greater degree.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Mountain];
    }

  }

  condenseSoulCore(){
    if (this.soulCoreRank >= 9){
      this.logService.addLogMessage("You can't condense your soul core any further.","INJURY","EVENT");
      return;
    }
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.condenseSoulCoreCost){
      this.logService.addLogMessage("You don't have the spirituality required to ascend.","INJURY","EVENT");
      return;
    }
    if (this.inventoryService.checkFor("spiritGem") < (this.soulCoreRank + 12) * 10 ){
      this.logService.addLogMessage("You don't have the gem required to ascend.","INJURY","EVENT");
      return;
    }
    this.characterService.condenseSoulCore();
    this.dialog.closeAll();
  }

  reinforceMeridians(){
    if (this.meridianRank >= 9){
      this.logService.addLogMessage("You can't reinforce your meridians any further.","INJURY","EVENT");
      return;
    }
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.reinforceMeridiansCost){
      this.logService.addLogMessage("You don't have the spirituality required to ascend.","INJURY","EVENT");
      return;
    }
    if (this.inventoryService.checkFor("spiritGem") < (this.meridianRank + 16) * 10 ){
      this.logService.addLogMessage("You don't have the gem required to ascend.","INJURY","EVENT");
      return;
    }

    this.characterService.reinforceMeridians();
    this.dialog.closeAll();
  }

  upgradeBloodline(){
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.bloodlineCost){
      this.logService.addLogMessage("You don't have the spirituality required to ascend.","INJURY","EVENT");
      return;
    }
    if (this.characterService.characterState.bloodlineRank >= 4){
      this.logService.addLogMessage("You can't enhance your bloodline any further.","INJURY","EVENT");
      return;
    }
    if (this.homeService.home.type < this.bloodLineHomeRequirement.type){
      this.logService.addLogMessage("You don't have a powerful enough home to ascend.","INJURY","EVENT");
      return;
    }
    this.characterService.upgradeBloodline();
    this.dialog.closeAll();
  }

}

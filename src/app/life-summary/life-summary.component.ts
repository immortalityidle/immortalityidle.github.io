import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { FollowersService } from '../game-state/followers.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { InventoryService } from '../game-state/inventory.service';

@Component({
  selector: 'app-life-summary',
  templateUrl: './life-summary.component.html',
  styleUrls: ['./life-summary.component.less', '../app.component.less']
})
export class LifeSummaryComponent {

  causeOfDeath = "";
  attributeGains = "";
  tip = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {causeOfDeath: string, attributeGains: string},
    public characterService: CharacterService,
    private activityService: ActivityService,
    private inventoryService: InventoryService,
    private followerSerivce: FollowersService,
    private impossibleTaskService: ImpossibleTaskService
  ) {
    this.causeOfDeath = data.causeOfDeath;
    this.attributeGains = data.attributeGains;
    this.tip = "";
    if ( this.characterService.characterState.age < 25 * 365 ){
      this.tip = "Life for an aspiring immortal can be brutal in the beginning. You may need to swallow your pride and do whatever is necessary to survive. A better home goes a long way toward keeping you safe.";
    } else if ( this.characterService.characterState.age < 35 * 365 && this.characterService.characterState.attributes.intelligence.value < 200 ){
      this.tip = "Life for an aspiring immortal can be frustratingly short. Perhaps increasing your intelligence might open up new avenues for extending your life.";
    } else if ( this.characterService.characterState.age < 140 * 365 ){
      this.tip = "Life for an aspiring immortal can be frustratingly short. Farming some healthy food might give you just what you need.";
    } else if ( this.activityService.completedApprenticeships.length < 4 ){
      this.tip = "Blacksmithing, alchemy, woodworking, and leatherworking are all essential trades for an aspiring immortal. You should master them all.";
    } else if ( this.characterService.characterState.attributes.spirituality.value <= 0 ){
      this.tip = "Balance is important to aspiring immortals. You'll need to develop all of your attributes if you want to progress in your journey.";
    } else if ( this.characterService.characterState.attributes.spirituality.value <= 10 ){
      this.tip = "Developing your spirituality is essential. Focusing on your spiritual development will help you on your way to immortality.";
    } else if ( !this.inventoryService.autoWeaponMergeUnlocked ){
      this.tip = "Your quest toward immortality will require battling mighty foes. Powerful weapons will be critical to defeating them.";
    } else if ( !this.inventoryService.autoArmorMergeUnlocked ){
      this.tip = "Your quest toward immortality will require battling mighty foes. Reliable armor will be critical to surviving.";
    } else if ( this.characterService.characterState.bloodlineRank < 1 || this.characterService.soulCoreRank() < 1 || this.characterService.meridianRank() < 1 ){
      this.tip = "Ascension provides a pathway to the power you'll need to achieve immortality. Each ascension technique benefits you in unique and important ways.";
    } else if ( !this.characterService.characterState.manaUnlocked ){
      this.tip = "Magic will be required for your journey to immortality. Only by balancing your mastery of the five elements will you be able to access magical powers.";
    } else if ( this.characterService.characterState.status.stamina.max < 200 ){
      this.tip = "Building up your stamina requires protein. Hunting of fishing can provide you with the food that you need to take on more challenging tasks.";
    } else if ( this.followerSerivce.followers.length < 5 ){
      this.tip = "Recruiting more followers will help you advance toward immortality. Perhaps its time to return to politics to build up the charm you'll need to recruit.";
    } else if ( this.followerSerivce.highestLevel <= 1 ){
      this.tip = "Your followers are too weak to give you the help you need. Perhaps its time to return to politics to build up the charm you'll need to train them to be stronger.";
    } else if ( !this.impossibleTaskService.impossibleTasksUnlocked ){
      this.tip = "Ascensions are the key to your progress now. Push forward!";
    } else if ( !this.characterService.characterState.immortal ){
      this.tip = "You're so close now. If you could only manage to do the impossible, you know you would achieve immortality.";
    }

  }

  showLifeSummaryChange(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.characterService.characterState.showLifeSummary = event.target.checked;
  }

}

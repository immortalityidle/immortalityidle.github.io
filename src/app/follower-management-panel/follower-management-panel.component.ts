import { Component, forwardRef, Inject } from '@angular/core';
import { FollowersService, Follower, SavedAssignments, AssignmentTrigger } from '../game-state/followers.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../pipes';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-follower-management-panel',
  templateUrl: './follower-management-panel.component.html',
  styleUrls: ['./follower-management-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => FormsModule),
    forwardRef(() => KeyValuePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => TooltipDirective),
    forwardRef(() => MatTabGroup),
    forwardRef(() => MatTab),
    forwardRef(() => MatIcon),
    forwardRef(() => MatSelectModule),
  ],
})
export class FollowerManagementPanelComponent {
  private changeAll = 0;
  protected pets = false;
  protected followerType: 'Follower' | 'Pet' = 'Follower';
  protected followers: Follower[];
  protected followerCap: number;
  protected maxFollowerByType: { [key: string]: number };
  inputSave = 'Saved Assignments #1';
  savedAssignments: SavedAssignments[];
  triggers: AssignmentTrigger[];
  attributeKeys: string[];
  statusMaxes: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { pets: boolean },
    protected followerService: FollowersService,
    private characterService: CharacterService
  ) {
    this.attributeKeys = Object.keys(this.characterService.attributes);
    this.statusMaxes = Object.keys(this.characterService.status);

    this.pets = data.pets;
    this.followers = followerService.followers;
    this.followerCap = followerService.followerCap;
    this.maxFollowerByType = followerService.maxFollowerByType;
    this.savedAssignments = followerService.savedFollowerAssignments;
    this.triggers = followerService.followerTriggers;
    if (this.pets) {
      this.followerType = 'Pet';
      this.followers = followerService.pets;
      this.followerCap = followerService.petsCap;
      this.maxFollowerByType = followerService.maxPetsByType;
      this.savedAssignments = followerService.savedPetAssignments;
      this.triggers = followerService.petTriggers;
    }
  }

  protected getTotalAssingments() {
    let max = 0;
    for (const followerType in this.followerService.jobs) {
      if (
        !this.followerService.jobs[followerType].hidden &&
        (this.followerService.jobs[followerType].pet === this.pets ||
          (!this.followerService.jobs[followerType].pet && !this.pets))
      ) {
        if (this.maxFollowerByType[followerType]) {
          max += this.maxFollowerByType[followerType];
        } else if (this.maxFollowerByType[followerType] !== 0) {
          max += 1000;
        }
      }
    }
    return max;
  }

  protected changeAllChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.changeAll = parseInt(event.target.value);
  }

  protected changeAllClicked() {
    for (const key in this.followerService.jobs) {
      if (this.pets && this.followerService.jobs[key].pet) {
        this.followerService.setMaxPets(key, this.changeAll);
      } else if (!this.pets && !this.followerService.jobs[key].pet) {
        this.followerService.setMaxFollowers(key, this.changeAll);
      }
    }
  }

  protected keepValueChanged(event: Event, job: string) {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.pets) {
      this.followerService.setMaxPets(job, parseInt(event.target.value));
    } else {
      this.followerService.setMaxFollowers(job, parseInt(event.target.value));
    }
  }

  protected sortAscSwitch() {
    this.followerService.sortAscending = !this.followerService.sortAscending;
  }

  protected sortOrderChanged(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.followerService.sortField = event.target.value;
    this.followerService.sortFollowers(this.followerService.sortAscending, this.pets);
  }

  protected dismissAllClicked() {
    this.followerService.dismissAllFollowers(undefined, this.pets);
  }

  protected saveAssignments() {
    this.followerService.saveAssignments(this.inputSave, this.pets);
    this.updateFollowerVariables();
  }

  inputSaveChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inputSave = event.target.value;
  }

  loadAssignments(saveName: string) {
    this.followerService.loadSavedAssignments(saveName, this.pets);
    this.updateFollowerVariables();
  }

  removeAssignments(saveName: string) {
    this.followerService.removeSavedAssignments(saveName, this.pets);
    this.updateFollowerVariables();
  }

  updateFollowerVariables() {
    if (this.pets) {
      this.savedAssignments = this.followerService.savedPetAssignments;
      this.maxFollowerByType = this.followerService.maxPetsByType;
    } else {
      this.savedAssignments = this.followerService.savedFollowerAssignments;
      this.maxFollowerByType = this.followerService.maxFollowerByType;
    }
  }

  triggerValueChange(event: Event, trigger: AssignmentTrigger) {
    if (!(event.target instanceof HTMLInputElement)) return;
    trigger.value = parseInt(event.target.value);
  }

  removeTrigger(trigger: AssignmentTrigger) {
    const index = this.triggers.indexOf(trigger);
    this.triggers.splice(index, 1);
  }

  addTrigger() {
    this.triggers.push({
      attribute: 'strength',
      value: 100,
      savedAssignmentsName: '',
    });
  }
}

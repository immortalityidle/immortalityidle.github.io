import { Component, Inject } from '@angular/core';
import { FollowersService, Follower } from '../game-state/followers.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { CamelToTitlePipe } from '../app.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-follower-management-panel',
  templateUrl: './follower-management-panel.component.html',
  styleUrls: ['./follower-management-panel.component.less', '../app.component.less'],
  imports: [FormsModule, KeyValuePipe, CamelToTitlePipe, TooltipDirective],
})
export class FollowerManagementPanelComponent {
  changeAll = 0;
  pets = false;
  followerType = 'Follower';
  followers: Follower[];
  followerCap: number;
  maxFollowerByType: { [key: string]: number };
  constructor(@Inject(MAT_DIALOG_DATA) public data: { pets: boolean }, public followerService: FollowersService) {
    this.pets = data.pets;
    this.followers = followerService.followers;
    this.followerCap = followerService.followerCap;
    this.maxFollowerByType = followerService.maxFollowerByType;
    if (this.pets) {
      this.followerType = 'Pet';
      this.followers = followerService.pets;
      this.followerCap = followerService.petsCap;
      this.maxFollowerByType = followerService.maxPetsByType;
    }
  }

  getTotalAssingments() {
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

  changeAllChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.changeAll = parseInt(event.target.value);
  }

  changeAllClicked() {
    for (const key in this.followerService.jobs) {
      if (this.pets && this.followerService.jobs[key].pet) {
        this.followerService.setMaxPets(key, this.changeAll);
      } else if (!this.pets && !this.followerService.jobs[key].pet) {
        this.followerService.setMaxFollowers(key, this.changeAll);
      }
    }
  }

  keepValueChanged(event: Event, job: string) {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.pets) {
      this.followerService.setMaxPets(job, parseInt(event.target.value));
    } else {
      this.followerService.setMaxFollowers(job, parseInt(event.target.value));
    }
  }

  sortAscSwitch() {
    this.followerService.sortAscending = !this.followerService.sortAscending;
  }

  sortOrderChanged(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.followerService.sortField = event.target.value;
    this.followerService.sortFollowers(this.followerService.sortAscending, this.pets);
  }

  dismissAllClicked() {
    this.followerService.dismissAllFollowers(undefined, this.pets);
  }
}

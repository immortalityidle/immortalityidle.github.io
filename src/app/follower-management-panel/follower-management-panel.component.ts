import { Component, forwardRef, Inject } from '@angular/core';
import { FollowersService, Follower } from '../game-state/followers.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../pipes';

@Component({
  selector: 'app-follower-management-panel',
  templateUrl: './follower-management-panel.component.html',
  styleUrls: ['./follower-management-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => FormsModule),
    forwardRef(() => KeyValuePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class FollowerManagementPanelComponent {
  private changeAll = 0;
  protected pets = false;
  protected followerType: 'Follower' | 'Pet' = 'Follower';
  protected followers: Follower[];
  protected followerCap: number;
  protected maxFollowerByType: { [key: string]: number };
  constructor(@Inject(MAT_DIALOG_DATA) data: { pets: boolean }, protected followerService: FollowersService) {
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
}

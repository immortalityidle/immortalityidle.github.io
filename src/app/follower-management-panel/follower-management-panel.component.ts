import { Component, OnInit } from '@angular/core';
import { makeStateKey } from '@angular/platform-browser';
import { FollowersService } from '../game-state/followers.service';

@Component({
  selector: 'app-follower-management-panel',
  templateUrl: './follower-management-panel.component.html',
  styleUrls: ['./follower-management-panel.component.less', '../app.component.less']
})
export class FollowerManagementPanelComponent implements OnInit {

  changeAll = 0;
  constructor(public followerService: FollowersService) { }

  ngOnInit(): void {
    let a;
  }

  getTotalAssingments(){
    let max = 0;
    for (const followerType in this.followerService.jobs){
      if (this.followerService.maxFollowerByType[followerType]){
        max += this.followerService.maxFollowerByType[followerType];
      } else if (!this.followerService.jobs[followerType].hidden){
        max += 1000;
      }
    }
    return max;
  }

  changeAllChanged(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.changeAll = parseInt(event.target.value);
  }

  changeAllClicked(){
    for(const key in this.followerService.jobs){
      this.followerService.setMaxFollowers(key, this.changeAll);
    }
  }

  keepValueChanged(event: Event, job: string){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.followerService.setMaxFollowers(job, parseInt(event.target.value));
  }

  sortAscSwitch(){
    this.followerService.sortAscending = !this.followerService.sortAscending;
  }

  sortOrderChanged(event: Event){
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.followerService.sortField = event.target.value;
    this.followerService.sortFollowers(this.followerService.sortAscending);
  }
}

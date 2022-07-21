import { Component, OnInit } from '@angular/core';
import { FollowersService } from '../game-state/followers.service';

@Component({
  selector: 'app-follower-management-panel',
  templateUrl: './follower-management-panel.component.html',
  styleUrls: ['./follower-management-panel.component.less', '../app.component.less']
})
export class FollowerManagementPanelComponent implements OnInit {

  constructor(public followerService: FollowersService) { }

  ngOnInit(): void {
    let a;
  }

  keepValueChanged(event: Event, job: string){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.followerService.setMaxFollowers(job, parseInt(event.target.value));
  }
}

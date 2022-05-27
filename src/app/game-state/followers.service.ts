import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';

export interface Follower {
  name: string;
  age: number;
  job: string;
  power: number;
}

export interface FollowersProperties {
  followers: Follower[]
}

@Injectable({
  providedIn: 'root'
})
export class FollowersService {

  followers: Follower[] = [];

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private homeService: HomeService,
    mainLoopService: MainLoopService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (!this.characterService.characterState.followersUnlocked){
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.characterService.characterState.age == 36500){
        // happy 100th birthday, you get a follower
        this.generateFollower();
      }
      for (let follower of this.followers){
        this.followerWorks(follower);
      }
    });
  }

  followerWorks(follower: Follower){
    if (follower.job == "builder"){
      this.homeService.nextHomeCostReduction += follower.power;
    }
  }

  reset() {
    this.followers.splice(0, this.followers.length);
  }

  getProperties(): FollowersProperties {
    return {
      followers: this.followers,
    }
  }

  setProperties(properties: FollowersProperties) {
    this.followers = properties.followers || [];
  }

  generateFollower(){
    this.logService.addLogMessage("A new follower has come to learn at your feet.","STANDARD","EVENT");
    this.followers.push({
      name: this.generateFollowerName(),
      age: 18,
      job: this.generateFollowerJob(),
      power: 1
    });
  }

  generateFollowerName(): string {
    return "foo";
    
  }
  generateFollowerJob(): string {
    return "builder";
  }
}

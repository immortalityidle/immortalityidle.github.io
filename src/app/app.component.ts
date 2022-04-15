import { Component, OnInit } from '@angular/core';
import { MainLoopService } from './main-loop.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'immortalityidle';

  constructor(
    private mainLoopService: MainLoopService
    ) {

  }
  ngOnInit(): void {
    this.mainLoopService.start();
  }
}

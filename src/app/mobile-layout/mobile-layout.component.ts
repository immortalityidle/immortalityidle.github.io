import { Component, forwardRef, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MobileDrawerComponent } from './mobile-drawer/mobile-drawer.component';
import { CommonButtonsService } from '../common-buttons.service';
import { environment } from 'src/environments/environment';
import { GameStateService } from '../game-state/game-state.service';
import { MobilePanelWrapperComponent } from './mobile-panel-wrapper/mobile-panel-wrapper.component';
import { NgClass } from '@angular/common';
import { CharacterService } from '../game-state/character.service';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-mobile-layout',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MobileDrawerComponent,
    MobilePanelWrapperComponent,
    NgClass,
    forwardRef(() => BigNumberPipe),
  ],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.less',
})
export class MobileLayoutComponent {
  protected readonly commonButtonsService = inject(CommonButtonsService);
  protected readonly gameStateService = inject(GameStateService);
  protected readonly characterService = inject(CharacterService);

  protected applicationVersion = environment.appVersion;
}

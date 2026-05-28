import { Component } from '@angular/core';
import {
  AVATAR_ALL_NATURAL,
  AVATAR_ASCETIC,
  AVATAR_BEAST_MASTER,
  AVATAR_BLOODTHIRSTY_BRAWLER,
  AVATAR_DARK_FEARING,
  AVATAR_DRUG_IMMUNE,
  AVATAR_SWORD_SAINT,
  AVATAR_TREE_LOVER,
  AVATAR_WANDERER,
  GameStateService,
} from '../game-state/game-state.service';

@Component({
  selector: 'app-avatar-modal',
  imports: [],
  templateUrl: './avatar-modal.component.html',
  styleUrl: './avatar-modal.component.less',
})
export class AvatarModalComponent {
  readonly BLOODTHIRSTY_BRAWLER = AVATAR_BLOODTHIRSTY_BRAWLER;
  readonly TREE_LOVER = AVATAR_TREE_LOVER;
  readonly DARK_FEARING = AVATAR_DARK_FEARING;
  readonly SWORD_SAINT = AVATAR_SWORD_SAINT;
  readonly DRUG_IMMUNE = AVATAR_DRUG_IMMUNE;
  readonly WANDERER = AVATAR_WANDERER;
  readonly ASCETIC = AVATAR_ASCETIC;
  readonly ALL_NATURAL = AVATAR_ALL_NATURAL;
  readonly BEAST_MASTER = AVATAR_BEAST_MASTER;

  constructor(public gameStateService: GameStateService) {}
}

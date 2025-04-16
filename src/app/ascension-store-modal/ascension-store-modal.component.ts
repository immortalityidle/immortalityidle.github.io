import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { CharacterService } from '../game-state/character.service';
import { DecimalPipe } from '@angular/common';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-ascension-store-modal',
  templateUrl: './ascension-store-modal.component.html',
  styleUrls: ['./ascension-store-modal.component.less'],
  imports: [forwardRef(() => DecimalPipe), forwardRef(() => BigNumberPipe)],
})
export class AscensionStoreModalComponent {
  constructor(protected storeService: StoreService, protected characterService: CharacterService) {}
}

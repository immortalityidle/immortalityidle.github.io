import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { CharacterService } from '../game-state/character.service';
import { DecimalPipe } from '@angular/common';
import { BigNumberPipe } from '../pipes';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-ascension-store-modal',
  templateUrl: './ascension-store-modal.component.html',
  styleUrls: ['./ascension-store-modal.component.less'],
  imports: [forwardRef(() => DecimalPipe), forwardRef(() => BigNumberPipe), MatDialogClose, MatIcon],
})
export class AscensionStoreModalComponent {
  constructor(protected storeService: StoreService, protected characterService: CharacterService) {}
}

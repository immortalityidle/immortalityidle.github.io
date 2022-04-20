import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { Character } from './character';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  characterState = new Character();
}

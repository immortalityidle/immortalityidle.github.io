import { Injectable } from '@angular/core';
import { Character } from './character';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  characterState = new Character();
  constructor() { }
}

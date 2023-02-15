import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReincarnationService {
  reincarnateSubject = new Subject<undefined>();

  constructor() {}

  reincarnate(): void {
    this.reincarnateSubject.next(undefined);
  }
}

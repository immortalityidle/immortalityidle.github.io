import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public isMobile = signal<boolean>(false);
}

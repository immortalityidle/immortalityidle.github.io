import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { environment } from './environments/environment';
import { TitleCasePipe, CommonModule } from '@angular/common';
import { AppComponent } from './app/app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KtdGridModule } from '@katoid/angular-grid-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BigNumberPipe } from './app/pipes';

const materialModules = [MatDialogModule, MatIconModule, MatTabsModule];

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      CommonModule,
      DragDropModule,
      KtdGridModule,
      ...materialModules
    ),
    TitleCasePipe,
    BigNumberPipe,
    MatSnackBar,
    provideAnimations(),
  ],
}).catch(err => console.error(err));

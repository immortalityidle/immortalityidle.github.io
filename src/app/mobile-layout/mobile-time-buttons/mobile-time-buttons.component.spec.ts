import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTimeButtonsComponent } from './mobile-time-buttons.component';

describe('MobileTimeButtonsComponent', () => {
  let component: MobileTimeButtonsComponent;
  let fixture: ComponentFixture<MobileTimeButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTimeButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileTimeButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

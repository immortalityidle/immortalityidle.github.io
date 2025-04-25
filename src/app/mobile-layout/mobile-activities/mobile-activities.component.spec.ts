import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileActivitiesComponent } from './mobile-activities.component';

describe('MobileActivitiesComponent', () => {
  let component: MobileActivitiesComponent;
  let fixture: ComponentFixture<MobileActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileActivitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

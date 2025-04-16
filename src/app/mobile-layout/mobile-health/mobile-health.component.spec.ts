import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHealthComponent } from './mobile-health.component';

describe('MobileHealthComponent', () => {
  let component: MobileHealthComponent;
  let fixture: ComponentFixture<MobileHealthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileHealthComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

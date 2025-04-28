import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTimeComponent } from './mobile-time.component';

describe('MobileTimeComponent', () => {
  let component: MobileTimeComponent;
  let fixture: ComponentFixture<MobileTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LifeSummaryComponent } from './life-summary.component';

describe('LifeSummaryComponent', () => {
  let component: LifeSummaryComponent;
  let fixture: ComponentFixture<LifeSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LifeSummaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LifeSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

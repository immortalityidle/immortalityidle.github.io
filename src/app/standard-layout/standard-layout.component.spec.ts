import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardLayoutComponent } from './standard-layout.component';

describe('StandardLayoutComponent', () => {
  let component: StandardLayoutComponent;
  let fixture: ComponentFixture<StandardLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

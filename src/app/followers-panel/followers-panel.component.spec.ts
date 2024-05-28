import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowersPanelComponent } from './followers-panel.component';

describe('FollowersPanelComponent', () => {
  let component: FollowersPanelComponent;
  let fixture: ComponentFixture<FollowersPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowersPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowersPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

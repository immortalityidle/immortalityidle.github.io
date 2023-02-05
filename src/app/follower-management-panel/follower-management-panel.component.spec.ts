import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowerManagementPanelComponent } from './follower-management-panel.component';

describe('FollowerManagementPanelComponent', () => {
  let component: FollowerManagementPanelComponent;
  let fixture: ComponentFixture<FollowerManagementPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FollowerManagementPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowerManagementPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

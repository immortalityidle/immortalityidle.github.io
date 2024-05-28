import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalPanelComponent } from './portal-panel.component';

describe('PortalPanelComponent', () => {
  let component: PortalPanelComponent;
  let fixture: ComponentFixture<PortalPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortalPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PortalPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangelogPanelComponent } from './changelog-panel.component';

describe('ChangelogPanelComponent', () => {
  let component: ChangelogPanelComponent;
  let fixture: ComponentFixture<ChangelogPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChangelogPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangelogPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

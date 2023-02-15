import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPanelComponent } from './export-panel.component';

describe('ExportPanelComponent', () => {
  let component: ExportPanelComponent;
  let fixture: ComponentFixture<ExportPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

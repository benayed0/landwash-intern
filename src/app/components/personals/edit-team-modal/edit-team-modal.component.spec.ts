import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTeamModalComponent } from './edit-team-modal.component';

describe('EditTeamModalComponent', () => {
  let component: EditTeamModalComponent;
  let fixture: ComponentFixture<EditTeamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTeamModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditTeamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

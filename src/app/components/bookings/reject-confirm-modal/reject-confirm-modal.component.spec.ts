import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectConfirmModalComponent } from './reject-confirm-modal.component';

describe('RejectConfirmModalComponent', () => {
  let component: RejectConfirmModalComponent;
  let fixture: ComponentFixture<RejectConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectConfirmModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RejectConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

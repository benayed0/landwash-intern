import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { BlockedDateService } from '../../../services/blocked-date.service';
import { BlockedDate, CreateBlockedDateDto } from '../../../models/blocked-date.model';
import { BlockedDateCardComponent } from '../blocked-date-card/blocked-date-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { CreateBlockedDateComponent } from '../create-blocked-date/create-blocked-date.component';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-blocked-date-list',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    BlockedDateCardComponent,
  ],
  templateUrl: './blocked-date-list.component.html',
  styleUrls: ['./blocked-date-list.component.css'],
})
export class BlockedDateListComponent implements OnInit {
  private blockedDateService = inject(BlockedDateService);
  private toast = inject(HotToastService);
  private dialog = inject(MatDialog);

  blockedDates = signal<BlockedDate[]>([]);
  loading = signal<boolean>(false);
  activeTab = signal<string>('upcoming');

  upcomingBlockedDates = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.blockedDates().filter(
      (bd) => new Date(bd.endDate) >= now
    );
  });

  pastBlockedDates = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.blockedDates().filter(
      (bd) => new Date(bd.endDate) < now
    );
  });

  currentBlockedDates = computed(() => {
    switch (this.activeTab()) {
      case 'upcoming':
        return this.upcomingBlockedDates();
      case 'past':
        return this.pastBlockedDates();
      default:
        return this.blockedDates();
    }
  });

  sectionTitle = computed(() => {
    switch (this.activeTab()) {
      case 'upcoming':
        return 'Dates Bloquees a Venir';
      case 'past':
        return 'Dates Bloquees Passees';
      default:
        return 'Toutes les Dates Bloquees';
    }
  });

  ngOnInit() {
    this.loadBlockedDates();
  }

  private loadBlockedDates() {
    this.loading.set(true);
    this.blockedDateService.getAll().subscribe({
      next: (blockedDates) => {
        this.blockedDates.set(blockedDates);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading blocked dates:', error);
        this.toast.error('Erreur lors du chargement des dates bloquees');
        this.loading.set(false);
      },
    });
  }

  onBlockedDateUpdate(event: {
    blockedDateId: string;
    updateData: Partial<CreateBlockedDateDto>;
  }) {
    this.loading.set(true);
    this.blockedDateService.update(event.blockedDateId, event.updateData).subscribe({
      next: () => {
        this.loadBlockedDates();
        this.toast.success('Date bloquee mise a jour');
      },
      error: (error) => {
        console.error('Error updating blocked date:', error);
        this.toast.error('Erreur lors de la mise a jour');
        this.loading.set(false);
      },
    });
  }

  onBlockedDateDelete(blockedDateId: string) {
    this.loading.set(true);
    this.blockedDateService.delete(blockedDateId).subscribe({
      next: () => {
        const current = this.blockedDates();
        const updated = current.filter((bd) => bd._id !== blockedDateId);
        this.blockedDates.set(updated);
        this.toast.success('Date bloquee supprimee');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting blocked date:', error);
        this.toast.error('Erreur lors de la suppression');
        this.loading.set(false);
      },
    });
  }

  showCreateBlockedDateModal() {
    const dialogRef = this.dialog.open(CreateBlockedDateComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBlockedDates();
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}

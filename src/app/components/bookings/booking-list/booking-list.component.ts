import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { TeamService } from '../../../services/team.service';
import { AuthService } from '../../../services/auth.service';
import { Booking, BookingStatus } from '../../../models/booking.model';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { BookingCardComponent } from '../booking-card/booking-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { RejectConfirmModalComponent } from '../reject-confirm-modal/reject-confirm-modal.component';
import { CreateBookingComponent } from '../create-booking/create-booking.component';
import { MatDialog } from '@angular/material/dialog';
import { PriceConfirmModalComponent } from '../price-confirm-modal/price-confirm-modal.component';
import { TeamAssignModalComponent } from '../../personals/team-assign-modal/team-assign-modal.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ViewBookingModalComponent } from '../view-booking-modal/view-booking-modal.component';
import { UserFilterSelectComponent } from '../../shared/user-filter-select/user-filter-select.component';
import {
  FilterSelectComponent,
  FilterOption,
} from '../../shared/filter-select/filter-select.component';
import {
  SortSelectComponent,
  SortOption,
} from '../../shared/sort-select/sort-select.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BookingCardComponent,
    LoadingSpinnerComponent,
    UserFilterSelectComponent,
    FilterSelectComponent,
    SortSelectComponent,
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.css',
})
export class BookingListComponent implements OnInit {
  private bookingService = inject(BookingService);
  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  dialog = inject(MatDialog);

  activeTab = 'pending';
  loading = false;
  operationLoading: { [key: string]: boolean } = {};
  filtersExpanded = false;
  sortBy: string = 'date-asc';
  isFilterExpanded = signal(false);
  currentUser: Personal | null = null;
  userRole: 'admin' | 'worker' | null = null;
  bookingTypeFilter = signal<'all' | 'detailing' | 'salon'>('all');

  // Date filtering properties
  selectedPreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>(
    'all'
  );
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Team filtering properties
  teams = signal<Team[]>([]);
  personnel = signal<Personal[]>([]);
  clients = signal<any[]>([]);
  selectedTeam = signal<string>('all');
  selectedPersonnel = signal<string>('all');
  selectedClient = signal<string>('all');

  // Search properties for filters
  teamSearchTerm = signal<string>('');
  personnelSearchTerm = signal<string>('');

  // Use bookings from the centralized service
  pendingBookings = this.bookingService.pendingBookings;
  confirmedBookings = this.bookingService.confirmedBookings;
  inProgressBookings = this.bookingService.inProgressBookings;
  completedBookings = this.bookingService.completedBookings;
  rejectedBookings = this.bookingService.rejectedBookings;
  canceledBookings = this.bookingService.canceledBookings;

  // Modal state (only keeping this for reject operation)
  selectedBookingForRejection: Booking | null = null;

  // Personnel-Team sync effect (must be at class level to run in injection context)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private personnelTeamSyncEffect = effect(() => {
    const personnelId = this.selectedPersonnel();
    if (personnelId !== 'all') {
      const teamId = this.findTeamForPersonnel(personnelId);
      if (teamId && teamId !== this.selectedTeam()) {
        this.selectedTeam.set(teamId);
      }
    }
  });

  ngOnInit() {
    this.authService.checkIsAdmin().subscribe((isAdmin) => {
      this.userRole = isAdmin ? 'admin' : 'worker';
    });
    this.loadBookings();
    this.watchRouteParams();
    this.loadTeams();
    this.loadPersonnel();
    this.loadClients();
  }

  /**
   * Watch for route parameters and open view booking modal if bookingId is present
   */
  private watchRouteParams() {
    this.route.paramMap.subscribe((params) => {
      const bookingId = params.get('bookingId');

      if (bookingId) {
        this.openViewBookingModal(bookingId);
      }
    });
  }

  /**
   * Open view booking modal
   */
  openViewBookingModal(bookingId: string) {
    const dialogRef = this.dialog.open(ViewBookingModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { bookingId },
    });

    // Remove bookingId from route when dialog closes
    dialogRef.afterClosed().subscribe(() => {
      // Navigate back to bookings list without the bookingId parameter
      this.router.navigate(['/dashboard/bookings'], {
        queryParamsHandling: 'preserve',
      });
    });
  }

  loadBookings() {
    this.loading = true;
    this.bookingService.getAllBookings().subscribe({
      next: () => {
        // Bookings are now automatically stored in the service
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading = false;
      },
    });
  }

  loadTeams() {
    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (err) => {
        console.error('Error loading teams:', err);
      },
    });
  }

  loadPersonnel() {
    this.teamService.getAllPersonals().subscribe({
      next: (personnel) => {
        this.personnel.set(personnel);
      },
      error: (err) => {
        console.error('Error loading personnel:', err);
      },
    });
  }

  loadClients() {
    // Extract unique clients from bookings
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        const uniqueClients = bookings
          .map((booking) => booking.userId)
          .filter((user) => user && user._id) // Filter out null/undefined users
          .filter(
            (user, index, self) =>
              index === self.findIndex((u) => u._id === user._id)
          );
        console.log('Loaded clients:', uniqueClients);
        this.clients.set(uniqueClients);
      },
      error: (err) => {
        console.error('Error loading clients:', err);
      },
    });
  }

  // Computed properties for filtered bookings
  filteredPendingBookings = computed(() =>
    this.filterBookings(this.pendingBookings())
  );
  filteredConfirmedBookings = computed(() =>
    this.filterBookings(this.confirmedBookings())
  );
  filteredInProgressBookings = computed(() =>
    this.filterBookings(this.inProgressBookings())
  );
  filteredCompletedBookings = computed(() =>
    this.filterBookings(this.completedBookings())
  );
  filteredRejectedBookings = computed(() =>
    this.filterBookings(this.rejectedBookings())
  );
  filteredCanceledBookings = computed(() =>
    this.filterBookings(this.canceledBookings())
  );

  // Computed properties for filtered dropdown options
  filteredTeams = computed(() => {
    const searchTerm = this.teamSearchTerm().toLowerCase();
    if (!searchTerm) return this.teams();
    return this.teams().filter((team) =>
      team.name.toLowerCase().includes(searchTerm)
    );
  });

  filteredPersonnel = computed(() => {
    const searchTerm = this.personnelSearchTerm().toLowerCase();
    if (!searchTerm) return this.personnel();
    return this.personnel().filter(
      (person) =>
        person.name.toLowerCase().includes(searchTerm) ||
        person.email.toLowerCase().includes(searchTerm)
    );
  });

  // Computed properties for filter and sort options
  statusFilterOptions = computed<FilterOption[]>(() => [
    { value: 'all', label: 'Tous les statuts', count: this.getTotalBookings() },
    {
      value: 'pending',
      label: 'En attente',
      count: this.filteredPendingBookings().length,
    },
    {
      value: 'confirmed',
      label: 'Confirmées',
      count: this.filteredConfirmedBookings().length,
    },
    {
      value: 'in-progress',
      label: 'En cours',
      count: this.filteredInProgressBookings().length,
    },
    {
      value: 'completed',
      label: 'Terminées',
      count: this.filteredCompletedBookings().length,
    },
    {
      value: 'rejected',
      label: 'Rejetées',
      count: this.filteredRejectedBookings().length,
    },
    {
      value: 'canceled',
      label: 'Annulées',
      count: this.filteredCanceledBookings().length,
    },
  ]);

  sortOptions: SortOption[] = [
    { value: 'date-desc', label: "Date (récent d'abord)" },
    { value: 'date-asc', label: "Date (ancien d'abord)" },
    { value: 'price-desc', label: "Prix (élevé d'abord)" },
    { value: 'price-asc', label: "Prix (bas d'abord)" },
    { value: 'client-name', label: 'Client (A-Z)' },
    { value: 'status', label: 'Statut' },
  ];

  get currentBookings() {
    let bookings: Booking[];

    switch (this.activeTab) {
      case 'all':
        bookings = [
          ...this.filteredPendingBookings(),
          ...this.filteredConfirmedBookings(),
          ...this.filteredInProgressBookings(),
          ...this.filteredCompletedBookings(),
          ...this.filteredRejectedBookings(),
          ...this.filteredCanceledBookings(),
        ];
        break;
      case 'pending':
        bookings = this.filteredPendingBookings();
        break;
      case 'confirmed':
        bookings = this.filteredConfirmedBookings();
        break;
      case 'in-progress':
        bookings = this.filteredInProgressBookings();
        break;
      case 'completed':
        bookings = this.filteredCompletedBookings();
        break;
      case 'rejected':
        bookings = this.filteredRejectedBookings();
        break;
      case 'canceled':
        bookings = this.filteredCanceledBookings();
        break;
      default:
        bookings = [];
    }

    return this.sortBookings(bookings);
  }

  get sectionTitle() {
    switch (this.activeTab) {
      case 'all':
        return 'Toutes les réservations';
      case 'pending':
        return 'Réservations en attente';
      case 'confirmed':
        return 'Réservations confirmées';
      case 'in-progress':
        return 'Réservations en cours';
      case 'completed':
        return 'Réservations terminées';
      case 'rejected':
        return 'Réservations rejetées';
      case 'canceled':
        return 'Réservations annulées';
      default:
        return '';
    }
  }
  openAddBookingModal() {
    const dialogRef = this.dialog.open(CreateBookingComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.bookingCreated.subscribe(() => {
      this.onBookingCreated();
      dialogRef.close();
    });
  }
  onStatusChange(event: { id: string; status: string }) {
    this.operationLoading[`status-${event.id}`] = true;
    this.bookingService
      .updateBookingStatus(event.id, event.status as BookingStatus)
      .subscribe({
        next: () => {
          this.loadBookings();
          this.operationLoading[`status-${event.id}`] = false;
        },
        error: (err) => {
          console.error('Error updating booking:', err);
          this.operationLoading[`status-${event.id}`] = false;
        },
      });
  }

  onRequestComplete(booking: Booking) {
    const dialogRef = this.dialog.open(PriceConfirmModalComponent, {
      data: { booking },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.confirmComplete.subscribe(
      (event: { booking: Booking; price: number }) => {
        this.onConfirmComplete(event);
        dialogRef.close();
      }
    );
  }

  onRequestConfirm(booking: Booking) {
    const dialogRef = this.dialog.open(TeamAssignModalComponent, {
      data: { booking, isReassignment: false },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.confirmAssign.subscribe(
      (event: { booking: Booking; teamId: string; transportFee: number }) => {
        this.onConfirmAssign(event);
        dialogRef.close();
      }
    );
  }

  onRequestReassignTeam(booking: Booking) {
    const dialogRef = this.dialog.open(TeamAssignModalComponent, {
      data: { booking, isReassignment: true },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.reassignTeam.subscribe(
      (event: { booking: Booking; teamId: string; transportFee: number }) => {
        this.onReassignTeam(event);
        dialogRef.close();
      }
    );
  }

  onRequestReject(booking: Booking) {
    const dialogRef = this.dialog.open(RejectConfirmModalComponent, {
      data: { booking },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.confirmReject.subscribe(() => {
      this.selectedBookingForRejection = booking;
      this.onConfirmReject();
      dialogRef.close();
    });
  }

  onRequestStartProgress(booking: Booking) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Démarrer la réservation',
        message: `Êtes-vous sûr de vouloir démarrer cette réservation pour ${
          booking.userId?.name || 'ce client'
        } ?`,
        confirmText: 'Démarrer',
        cancelText: 'Annuler',
      },
      width: '400px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.operationLoading[`start-progress-${booking._id}`] = true;
        this.bookingService
          .updateBookingStatus(booking._id!, 'in-progress')
          .subscribe({
            next: () => {
              this.loadBookings();
              this.operationLoading[`start-progress-${booking._id}`] = false;
            },
            error: (err) => {
              console.error('Error starting progress:', err);
              this.operationLoading[`start-progress-${booking._id}`] = false;
            },
          });
      }
    });
  }

  onRequestReconfirm(booking: Booking) {
    this.operationLoading[`reconfirm-${booking._id}`] = true;
    this.bookingService
      .updateBookingStatus(booking._id!, 'confirmed')
      .subscribe({
        next: () => {
          this.loadBookings();
          this.operationLoading[`reconfirm-${booking._id}`] = false;
        },
        error: (err) => {
          console.error('Error reconfirming booking:', err);
          this.operationLoading[`reconfirm-${booking._id}`] = false;
        },
      });
  }

  onConfirmComplete(event: { booking: Booking; price: number }) {
    this.operationLoading[`complete-${event.booking._id}`] = true;
    // First update the price, then update the status
    this.bookingService
      .updateBookingPrice(event.booking._id!, event.price)
      .subscribe({
        next: () => {
          // Now update status to completed
          this.bookingService
            .updateBookingStatus(event.booking._id!, 'completed')
            .subscribe({
              next: () => {
                this.loadBookings();
                this.operationLoading[`complete-${event.booking._id}`] = false;
              },
              error: (err: any) => {
                console.error('Error updating booking status:', err);
                this.operationLoading[`complete-${event.booking._id}`] = false;
              },
            });
        },
        error: (err: any) => {
          console.error('Error updating booking price:', err);
          this.operationLoading[`complete-${event.booking._id}`] = false;
        },
      });
  }

  onConfirmAssign(event: { booking: Booking; teamId: string; transportFee: number }) {
    this.operationLoading[`assign-${event.booking._id}`] = true;

    // First update transport fee if provided, then assign team, then update status to confirmed
    const updateData: Partial<Booking> = { transportFee: event.transportFee };

    this.bookingService.updateBooking(event.booking._id!, updateData).subscribe({
      next: () => {
        // Now assign the team
        this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
          next: () => {
            // Finally update status to confirmed
            this.bookingService
              .updateBookingStatus(event.booking._id!, 'confirmed')
              .subscribe({
                next: () => {
                  this.loadBookings();
                  this.operationLoading[`assign-${event.booking._id}`] = false;
                },
                error: (err: any) => {
                  console.error('Error updating booking status:', err);
                  this.operationLoading[`assign-${event.booking._id}`] = false;
                },
              });
          },
          error: (err: any) => {
            console.error('Error assigning team:', err);
            this.operationLoading[`assign-${event.booking._id}`] = false;
          },
        });
      },
      error: (err: any) => {
        console.error('Error updating transport fee:', err);
        this.operationLoading[`assign-${event.booking._id}`] = false;
      },
    });
  }

  onReassignTeam(event: { booking: Booking; teamId: string; transportFee: number }) {
    this.operationLoading[`reassign-${event.booking._id}`] = true;

    // First update transport fee if provided, then assign team
    const updateData: Partial<Booking> = { transportFee: event.transportFee };

    this.bookingService.updateBooking(event.booking._id!, updateData).subscribe({
      next: () => {
        // Now assign the team (don't change the status)
        this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
          next: () => {
            this.loadBookings();
            this.operationLoading[`reassign-${event.booking._id}`] = false;
            console.log('Team reassigned successfully with transport fee');
          },
          error: (err: any) => {
            console.error('Error reassigning team:', err);
            this.operationLoading[`reassign-${event.booking._id}`] = false;
          },
        });
      },
      error: (err: any) => {
        console.error('Error updating transport fee:', err);
        this.operationLoading[`reassign-${event.booking._id}`] = false;
      },
    });
  }

  onConfirmReject() {
    if (!this.selectedBookingForRejection) return;

    const booking = this.selectedBookingForRejection;
    this.operationLoading[`reject-${booking._id}`] = true;
    this.bookingService
      .updateBookingStatus(booking._id!, 'rejected')
      .subscribe({
        next: () => {
          this.loadBookings();
          this.operationLoading[`reject-${booking._id}`] = false;
          this.selectedBookingForRejection = null;
        },
        error: (err) => {
          console.error('Error rejecting booking:', err);
          this.operationLoading[`reject-${booking._id}`] = false;
          alert('Erreur lors du rejet de la réservation');
        },
      });
  }

  onBookingCreated() {
    this.loadBookings(); // Reload bookings to show the new one
  }

  isOperationLoading(operation: string, id: string): boolean {
    return this.operationLoading[`${operation}-${id}`] || false;
  }

  applyDateFilter() {
    // Method for explicit filter application if needed
    // The filtering is already reactive through computed properties
  }

  isDateRangeValid(): boolean {
    if (this.selectedPreset() !== 'custom') return true;

    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) return false;

    return new Date(start) <= new Date(end);
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Date filtering methods
  setDatePreset(preset: 'all' | 'today' | '7days' | '30days' | 'custom') {
    this.selectedPreset.set(preset);
    const today = new Date();
    const todayStr = this.formatDateToLocalString(today);

    switch (preset) {
      case 'all':
        this.startDate.set('');
        this.endDate.set('');
        break;
      case 'today':
        this.startDate.set(todayStr);
        this.endDate.set(todayStr);
        break;
      case '7days':
        const sevenDaysAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(this.formatDateToLocalString(sevenDaysAgo));
        this.endDate.set(todayStr);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(this.formatDateToLocalString(thirtyDaysAgo));
        this.endDate.set(todayStr);
        break;
      case 'custom':
        // Keep existing dates or set to today if empty
        if (!this.startDate()) this.startDate.set(todayStr);
        if (!this.endDate()) this.endDate.set(todayStr);
        break;
    }
  }

  // Helper function to format date to local YYYY-MM-DD string without timezone issues
  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.startDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  onEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.endDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  private filterBookings(bookings: Booking[]): Booking[] {
    // Return empty array if bookings haven't loaded yet
    if (!bookings || bookings.length === 0) {
      return [];
    }

    let filteredBookings = bookings;

    // Apply booking type filtering
    if (this.bookingTypeFilter() !== 'all') {
      if (this.bookingTypeFilter() === 'detailing') {
        filteredBookings = filteredBookings.filter(
          (booking) => booking.type === 'small' || booking.type === 'big' || booking.type === 'pickup'
        );
      } else if (this.bookingTypeFilter() === 'salon') {
        filteredBookings = filteredBookings.filter(
          (booking) => booking.type === 'salon'
        );
      }
    }

    // Apply date filtering
    if (
      this.selectedPreset() !== 'all' &&
      (this.startDate() || this.endDate())
    ) {
      const start = this.startDate() ? new Date(this.startDate()) : null;
      const end = this.endDate() ? new Date(this.endDate()) : null;

      filteredBookings = filteredBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);

        if (start && bookingDate < start) return false;
        if (end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (bookingDate > endOfDay) return false;
        }

        return true;
      });
    }

    // Apply team filtering
    if (this.selectedTeam() !== 'all') {
      filteredBookings = filteredBookings.filter((booking) => {
        if (!booking.teamId) return false;
        const teamId =
          typeof booking.teamId === 'string'
            ? booking.teamId
            : booking.teamId._id;
        return teamId === this.selectedTeam();
      });
    }

    // Apply personnel filtering
    if (this.selectedPersonnel() !== 'all') {
      filteredBookings = filteredBookings.filter((booking) => {
        console.log(
          ((booking.teamId as Team)?.members as Personal[])?.map((m) => m._id),
          this.selectedPersonnel()
        );

        if (!booking.teamId || typeof booking.teamId === 'string') return false;
        const team = booking.teamId as any;
        return (
          (team.chiefId && team.chiefId._id === this.selectedPersonnel()) ||
          ((booking.teamId as Team).members as Personal[])
            .map((m) => m._id)
            .includes(this.selectedPersonnel())
        );
      });
    }

    // Apply client filtering
    if (this.selectedClient() !== 'all') {
      filteredBookings = filteredBookings.filter((booking) => {
        return booking.userId && booking.userId._id === this.selectedClient();
      });
    }

    return filteredBookings;
  }

  // Event handlers for searchable selects
  onSearchFocus(event: Event) {
    const target = event.target as HTMLElement;
    const parent = target.parentElement;
    if (parent) {
      parent.classList.add('focused');
    }
  }

  onSearchBlur(event: Event) {
    const target = event.target as HTMLElement;
    const parent = target.parentElement;
    if (parent) {
      parent.classList.remove('focused');
    }
  }

  onBookingUpdate(event: { bookingId: string; updateData: Partial<Booking> }) {
    this.bookingService
      .updateBooking(event.bookingId, event.updateData)
      .subscribe({
        next: (updatedBooking) => {
          // Service automatically updates state via tap operator
          console.log('Booking updated successfully:', updatedBooking);
        },
        error: (err: any) => {
          console.error('Error updating booking:', err);
        },
      });
  }

  private findTeamForPersonnel(personnelId: string): string | null {
    const teams = this.teams();

    // Check if the personnel is a team chief
    for (const team of teams) {
      if (team.chiefId && (team.chiefId as Personal)._id === personnelId) {
        return team._id || null;
      }
    }

    // Check if the personnel is a team member
    for (const team of teams) {
      if (
        team.members &&
        (team.members as Personal[]).map((m) => m._id).includes(personnelId)
      ) {
        return team._id || null;
      }
    }

    return null;
  }

  onSortChange() {
    // Trigger change detection by just changing the sort property
    // The currentBookings getter will automatically apply the new sort
  }

  onStatusFilterChange() {
    // Trigger change detection when status filter changes
    // The currentBookings getter will automatically apply the new filter
  }

  onBookingTypeFilterChange() {
    // Trigger change detection when booking type filter changes
    // The currentBookings getter will automatically apply the new filter
  }

  toggleFilters() {
    this.isFilterExpanded.set(!this.isFilterExpanded());
  }

  getTotalBookings(): number {
    return (
      this.filteredPendingBookings().length +
      this.filteredConfirmedBookings().length +
      this.filteredInProgressBookings().length +
      this.filteredCompletedBookings().length +
      this.filteredRejectedBookings().length +
      this.filteredCanceledBookings().length
    );
  }

  private sortBookings(bookings: Booking[]): Booking[] {
    if (!bookings || bookings.length === 0) return bookings;

    const sorted = [...bookings];

    switch (this.sortBy) {
      case 'date-desc':
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case 'date-asc':
        return sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'client-name':
        return sorted.sort((a, b) => {
          const nameA = a.userId?.name || '';
          const nameB = b.userId?.name || '';
          return nameA.localeCompare(nameB, 'fr');
        });
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }
}

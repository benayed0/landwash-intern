import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AddUserModalComponent } from './add-user-modal/add-user-modal.component';

interface Subscription {
  id: string;
  plan: string;
  allowedBookingsPerMonth: number;
  used: number;
  remaining: number;
  status: 'active' | 'pending' | 'cancelled';
  renewalDate: Date;
}

export interface User {
  _id: string;
  email?: string | null;
  memberSince: Date;
  phoneNumber: string;
  name?: string;
  bookings: any[];
  orders: any[];
  subscription?: Subscription | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AddUserModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  showAddUserModal = false;
  activeFilter: 'all' | 'active' | 'bookings' | 'orders' = 'all';

  // Sort and filter options
  sortBy: 'name' | 'date' | 'bookings' | 'orders' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  showSortMenu = false;
  showFilterPanel = false;

  // Advanced filters
  statusFilters = {
    active: false,
    pending: false,
    cancelled: false,
    noSubscription: false
  };

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Error loading users:', err);
      },
    });
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getSubscriptionStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  }

  getSubscriptionStatusText(status?: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Aucun';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user._id;
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  filterUsers(): void {
    let result = [...this.users];

    // Apply filter by category (quick filters)
    switch (this.activeFilter) {
      case 'active':
        result = result.filter((u) => u.subscription?.status === 'active');
        break;
      case 'bookings':
        result = result.filter((u) => u.bookings && u.bookings.length > 0);
        break;
      case 'orders':
        result = result.filter((u) => u.orders && u.orders.length > 0);
        break;
      case 'all':
      default:
        break;
    }

    // Apply advanced status filters
    const activeStatusFilters = Object.entries(this.statusFilters)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (activeStatusFilters.length > 0) {
      result = result.filter((user) => {
        if (activeStatusFilters.includes('active') && user.subscription?.status === 'active') return true;
        if (activeStatusFilters.includes('pending') && user.subscription?.status === 'pending') return true;
        if (activeStatusFilters.includes('cancelled') && user.subscription?.status === 'cancelled') return true;
        if (activeStatusFilters.includes('noSubscription') && !user.subscription) return true;
        return false;
      });
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((user) => {
        const phoneMatch = user.phoneNumber?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        return phoneMatch || emailMatch || nameMatch;
      });
    }

    // Apply sorting
    result = this.sortUsers(result);

    this.filteredUsers = result;
  }

  sortUsers(users: User[]): User[] {
    return users.sort((a, b) => {
      let compareValue = 0;

      switch (this.sortBy) {
        case 'name':
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'date':
          compareValue = new Date(a.memberSince).getTime() - new Date(b.memberSince).getTime();
          break;
        case 'bookings':
          compareValue = (a.bookings?.length || 0) - (b.bookings?.length || 0);
          break;
        case 'orders':
          compareValue = (a.orders?.length || 0) - (b.orders?.length || 0);
          break;
      }

      return this.sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterUsers();
  }

  setFilter(filter: 'all' | 'active' | 'bookings' | 'orders'): void {
    this.activeFilter = filter;
    this.filterUsers();
  }

  setSortBy(sortBy: 'name' | 'date' | 'bookings' | 'orders'): void {
    if (this.sortBy === sortBy) {
      // Toggle sort order if clicking the same sort option
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.showSortMenu = false;
    this.filterUsers();
  }

  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu;
    if (this.showSortMenu) {
      this.showFilterPanel = false;
    }
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
    if (this.showFilterPanel) {
      this.showSortMenu = false;
    }
  }

  toggleStatusFilter(status: keyof typeof this.statusFilters): void {
    this.statusFilters[status] = !this.statusFilters[status];
    this.filterUsers();
  }

  clearAllFilters(): void {
    this.statusFilters = {
      active: false,
      pending: false,
      cancelled: false,
      noSubscription: false
    };
    this.activeFilter = 'all';
    this.searchTerm = '';
    this.filterUsers();
  }

  getActiveFiltersCount(): number {
    return Object.values(this.statusFilters).filter(v => v).length;
  }

  withBookings() {
    return this.filteredUsers.filter(
      (u) => u.bookings && u.bookings.length > 0
    );
  }
  withOrders() {
    return this.filteredUsers.filter((u) => u.orders && u.orders.length > 0);
  }
  activeUsers() {
    return this.filteredUsers.filter(
      (u) => u.subscription?.status === 'active'
    );
  }

  openAddUserModal() {
    this.showAddUserModal = true;
  }

  closeAddUserModal() {
    this.showAddUserModal = false;
  }

  onUserAdded(newUser: User) {
    this.users.unshift(newUser);
    this.filteredUsers = [...this.users];
    this.closeAddUserModal();
  }
}

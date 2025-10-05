import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';

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
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter((user) => {
      const phoneMatch = user.phoneNumber?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const nameMatch = user.name?.toLowerCase().includes(searchLower);

      return phoneMatch || emailMatch || nameMatch;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredUsers = [...this.users];
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

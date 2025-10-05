import { Component, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../services/subscription.service';
import { UserService } from '../../services/user.service';
import {
  CreateSubscriptionDto,
  SubscriptionStatus,
  SubscriptionRenewalType,
} from '../../models/subscription.model';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { User } from '../users/users.component';

@Component({
  selector: 'app-create-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './create-subscription.component.html',
  styleUrls: ['./create-subscription.component.css'],
})
export class CreateSubscriptionComponent implements OnInit {
  @Output() subscriptionCreated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  submitted = false;
  userId: string | undefined;

  formData: CreateSubscriptionDto = {
    plan: '',
    price: 0,
    allowedBookingsPerMonth: 0,
    used: 0,
    startDate: this.getTodayDate(),
    renewalDate: this.getNextMonthDate(),
    status: 'pending' as SubscriptionStatus,
    renewalType: 'auto' as SubscriptionRenewalType,
  };

  constructor(
    private subscriptionService: SubscriptionService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }

  private getTodayDate(): Date {
    return new Date();
  }

  private getNextMonthDate(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  isPlanValid(): boolean {
    return this.formData.plan.trim() !== '';
  }

  isPriceValid(): boolean {
    return this.formData.price > 0;
  }

  isAllowedBookingsValid(): boolean {
    return this.formData.allowedBookingsPerMonth > 0;
  }

  isStartDateValid(): boolean {
    return this.formData.startDate !== undefined;
  }

  isRenewalDateValid(): boolean {
    if (!this.formData.renewalDate || !this.formData.startDate) {
      return false;
    }
    const startDate = new Date(this.formData.startDate);
    const renewalDate = new Date(this.formData.renewalDate);
    return renewalDate > startDate;
  }
  isUserIdValid(): boolean {
    return this.userId !== undefined && this.userId.trim() !== '';
  }
  isFormValid(): boolean {
    return (
      this.isUserIdValid() &&
      this.isPlanValid() &&
      this.isPriceValid() &&
      this.isAllowedBookingsValid() &&
      this.isStartDateValid() &&
      this.isRenewalDateValid()
    );
  }

  getSelectedUserName(): string {
    const selectedUser = this.users().find((user) => user._id === this.userId);
    return selectedUser ? selectedUser.name! : '';
  }

  onSubmit() {
    this.submitted = true;

    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);

    // Prepare the data for the API
    const subscriptionData: CreateSubscriptionDto = {
      plan: this.formData.plan,
      price: this.formData.price,
      allowedBookingsPerMonth: this.formData.allowedBookingsPerMonth,
      used: this.formData.used,
      startDate: new Date(this.formData.startDate),
      renewalDate: new Date(this.formData.renewalDate),
      status: this.formData.status,
      renewalType: this.formData.renewalType,
    };

    this.subscriptionService
      .createSubscription(this.userId!, subscriptionData)
      .subscribe({
        next: (subscription) => {
          console.log('Subscription created successfully:', subscription);
          this.isLoading.set(false);
          this.subscriptionCreated.emit();
        },
        error: (error) => {
          console.error('Error creating subscription:', error);
          this.isLoading.set(false);
          // Here you could show an error message to the user
        },
      });
  }

  onCancel() {
    this.cancelled.emit();
  }

  // Auto-update renewal date when start date changes
  onStartDateChange() {
    if (this.formData.startDate) {
      const startDate = new Date(this.formData.startDate);
      startDate.setMonth(startDate.getMonth() + 1);
      this.formData.renewalDate = startDate;
    }
  }

  // Helper methods for template
  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'active':
        return 'ACTIVE';
      case 'inactive':
        return 'INACTIVE';
      case 'canceled':
        return 'CANCELED';
      case 'expired':
        return 'EXPIRED';
      default:
        return status.toUpperCase();
    }
  }

  formatDisplayDate(dateString: Date): string {
    if (!dateString) return '';
    return dateString.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getSelectedUserPhone(): string {
    const selectedUser = this.users().find((user) => user._id === this.userId);
    return selectedUser ? selectedUser.phoneNumber : '';
  }

  getUsagePercentage(): number {
    if (this.formData.allowedBookingsPerMonth === 0) return 0;
    return Math.round(
      (this.formData.used / this.formData.allowedBookingsPerMonth) * 100
    );
  }

  getRemainingBookings(): number {
    return Math.max(
      0,
      this.formData.allowedBookingsPerMonth - this.formData.used
    );
  }
}

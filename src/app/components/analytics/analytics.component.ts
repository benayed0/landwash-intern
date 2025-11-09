import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../services/booking.service';
import { OrderService } from '../../services/order.service';
import { SubscriptionService } from '../../services/subscription.service';
import { Booking, BookingStatus } from '../../models/booking.model';
import { Order, OrderStatus } from '../../models/order.model';
import { SubscriptionTransaction } from '../../models/subscription.model';
import { User } from '../users/users.component';
import { Personal } from '../../models/personal.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { LabelService } from '../../services/label.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  @ViewChild('allTypeChart') allTypeChart!: ElementRef;
  @ViewChild('allMonthlyChart') allMonthlyChart!: ElementRef;
  @ViewChild('bookingTypeChart') bookingTypeChart!: ElementRef;
  @ViewChild('bookingStatusChart') bookingStatusChart!: ElementRef;
  @ViewChild('bookingMonthlyChart') bookingMonthlyChart!: ElementRef;
  @ViewChild('orderStatusChart') orderStatusChart!: ElementRef;
  @ViewChild('orderMonthlyChart') orderMonthlyChart!: ElementRef;
  @ViewChild('topProductsChart') topProductsChart!: ElementRef;
  @ViewChild('subscriptionStatusChart') subscriptionStatusChart!: ElementRef;
  @ViewChild('subscriptionMonthlyChart') subscriptionMonthlyChart!: ElementRef;
  @ViewChild('subscriptionPlanChart') subscriptionPlanChart!: ElementRef;

  bookings = signal<Booking[]>([]);
  orders = signal<Order[]>([]);
  subscriptions = signal<SubscriptionTransaction[]>([]);
  userRole = signal<Personal['role']>('partner'); // Placeholder for user role if needed
  analyticsView = signal<'all' | 'bookings' | 'orders' | 'subscriptions'>(
    this.userRole() === 'admin' ? 'all' : 'bookings'
  );

  // Date filtering properties
  selectedPreset = signal<'7days' | '30days' | '90days' | 'year' | 'custom'>(
    '30days'
  );
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Filtered data based on date range
  filteredBookings = computed(() => this.filterDataByDate(this.bookings()));
  filteredOrders = computed(() => this.filterDataByDate(this.orders()));
  filteredSubscriptions = computed(() =>
    this.filterSubscriptionsByDate(this.subscriptions())
  );

  private charts: { [key: string]: Chart<any, any, any> } = {};
  private getCommonChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e5e5e5',
            font: {
              size: 12,
            },
          },
        },
      },
    };
  }

  private getLineChartOptions() {
    return {
      ...this.getCommonChartOptions(),
      scales: {
        x: {
          ticks: {
            color: '#e5e5e5',
          },
          grid: {
            color: '#2a2a2a',
          },
        },
        y: {
          ticks: {
            color: '#e5e5e5',
          },
          grid: {
            color: '#2a2a2a',
          },
        },
      },
    };
  }

  private getBarChartOptions() {
    return {
      ...this.getCommonChartOptions(),
      scales: {
        x: {
          ticks: {
            color: '#e5e5e5',
          },
          grid: {
            color: '#2a2a2a',
          },
        },
        y: {
          ticks: {
            color: '#e5e5e5',
          },
          grid: {
            color: '#2a2a2a',
          },
        },
      },
    };
  }

  // Booking Analytics (using filtered data)
  totalBookings = computed(() => this.filteredBookings().length);
  bookingsRevenue = computed(() =>
    this.filteredBookings().reduce(
      (sum, booking) => sum + (booking.price || 0),
      0
    )
  );
  averageBookingPrice = computed(() => {
    const bookings = this.filteredBookings();
    return bookings.length > 0 ? this.bookingsRevenue() / bookings.length : 0;
  });
  bookingConfirmationRate = computed(() => {
    const bookings = this.filteredBookings();
    const confirmed = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'completed'
    ).length;
    return bookings.length > 0
      ? Math.round((confirmed / bookings.length) * 100)
      : 0;
  });

  // Order Analytics (using filtered data)
  totalOrders = computed(() => this.filteredOrders().length);
  ordersRevenue = computed(() =>
    this.filteredOrders().reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    )
  );
  averageOrderValue = computed(() => {
    const orders = this.filteredOrders();
    return orders.length > 0 ? this.ordersRevenue() / orders.length : 0;
  });
  orderDeliveryRate = computed(() => {
    const orders = this.filteredOrders();
    const delivered = orders.filter(
      (o) => o.status === 'delivered' || o.status === 'completed'
    ).length;
    return orders.length > 0
      ? Math.round((delivered / orders.length) * 100)
      : 0;
  });

  // Subscription Analytics (using filtered data)
  totalSubscriptions = computed(() => {
    const filtered = this.filteredSubscriptions();
    return filtered.length;
  });
  subscriptionRevenue = computed(() => {
    const filtered = this.filteredSubscriptions();
    const paid = filtered.filter(
      (transaction) => transaction.status === 'paid'
    );
    const revenue = paid.reduce(
      (sum, transaction) => sum + (transaction.amount || 0),
      0
    );

    return revenue;
  });
  averageSubscriptionPrice = computed(() => {
    const paidTransactions = this.filteredSubscriptions().filter(
      (t) => t.status === 'paid'
    );
    return paidTransactions.length > 0
      ? this.subscriptionRevenue() / paidTransactions.length
      : 0;
  });
  paidSubscriptionsRate = computed(() => {
    const subscriptions = this.filteredSubscriptions();
    const paid = subscriptions.filter((s) => s.status === 'paid').length;

    return subscriptions.length > 0
      ? Math.round((paid / subscriptions.length) * 100)
      : 0;
  });

  // Total Revenue combining all sources
  totalRevenue = computed(
    () =>
      this.bookingsRevenue() + this.ordersRevenue() + this.subscriptionRevenue()
  );

  constructor(
    private bookingService: BookingService,
    private orderService: OrderService,
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private labelService: LabelService
  ) {
    // Update charts when view changes OR when filtered data changes
    effect(() => {
      // Watch for changes in view, filtered data, or date range
      this.analyticsView();
      this.filteredBookings();
      this.filteredOrders();
      this.filteredSubscriptions();
      this.startDate();
      this.endDate();

      // Only refresh if we have data and charts are initialized
      if (
        this.bookings().length > 0 ||
        this.orders().length > 0 ||
        this.subscriptions().length > 0
      ) {
        setTimeout(() => this.updateChartsForView(), 100);
      }
    });
  }

  ngOnInit() {
    this.setDatePreset('30days'); // Initialize with 30 days preset
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initializeCharts(), 100);
  }

  ngOnDestroy() {
    Object.values(this.charts).forEach((chart) => chart?.destroy());
  }

  private loadData() {
    this.userRole.set(this.authService.isAdmin() ? 'admin' : 'partner');
    this.analyticsView.set(this.userRole() === 'admin' ? 'all' : 'bookings');
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
      },
      error: (error) => console.error('Error loading bookings:', error),
    });

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
      },
      error: (error) => console.error('Error loading orders:', error),
    });

    this.subscriptionService.getAllSubscriptionsHistory().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
      },
      error: (error) => console.error('Error loading subscriptions:', error),
    });
  }

  private initializeCharts() {
    this.updateChartsForView();
  }

  private updateChartsForView() {
    // Destroy existing charts
    Object.values(this.charts).forEach((chart) => chart?.destroy());
    this.charts = {};

    switch (this.analyticsView()) {
      case 'all':
        this.createAllAnalyticsCharts();
        break;
      case 'bookings':
        this.createBookingCharts();
        break;
      case 'orders':
        this.createOrderCharts();
        break;
      case 'subscriptions':
        this.createSubscriptionCharts();
        break;
    }
  }

  private createAllAnalyticsCharts() {
    // All Type Chart
    if (this.allTypeChart?.nativeElement) {
      const labels = ['Réservations'];
      const data = [this.totalBookings()];
      const backgroundColor = ['#36A2EB'];
      if (this.userRole() === 'admin') {
        labels.push('Commandes', 'Abonnements');
        data.push(this.totalOrders(), this.totalSubscriptions());
        backgroundColor.push('#FF6384', '#c3ff00');
      }

      const typeData = {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderWidth: 2,
          },
        ],
      };

      this.charts['allType'] = new Chart(this.allTypeChart.nativeElement, {
        type: 'doughnut',
        data: typeData,
        options: this.getCommonChartOptions(),
      });
    }

    // All Monthly Chart
    if (this.allMonthlyChart?.nativeElement) {
      const timeBasedData = this.getTimeBasedData();
      const datasets = [
        {
          label: 'Réservations',
          data: timeBasedData.bookings,
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4,
        },
      ];
      if (this.userRole() === 'admin') {
        datasets.push(
          {
            label: 'Commandes',
            data: timeBasedData.orders,
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Abonnements',
            data: timeBasedData.subscriptions,
            borderColor: '#c3ff00',
            backgroundColor: 'rgba(195, 255, 0, 0.1)',
            tension: 0.4,
          }
        );
      }
      this.charts['allMonthly'] = new Chart(
        this.allMonthlyChart.nativeElement,
        {
          type: 'line',
          data: {
            labels: timeBasedData.labels,
            datasets,
          },
          options: this.getLineChartOptions(),
        }
      );
    }
  }

  private createBookingCharts() {
    // Booking Type Chart
    if (this.bookingTypeChart?.nativeElement) {
      const typeStats = this.getBookingTypeStats();

      this.charts['bookingType'] = new Chart(
        this.bookingTypeChart.nativeElement,
        {
          type: 'pie',
          data: {
            labels: typeStats.labels,
            datasets: [
              {
                data: typeStats.data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                borderWidth: 2,
              },
            ],
          },
          options: this.getCommonChartOptions(),
        }
      );
    }

    // Booking Status Chart
    if (this.bookingStatusChart?.nativeElement) {
      const statusStats = this.getBookingStatusStats();

      this.charts['bookingStatus'] = new Chart(
        this.bookingStatusChart.nativeElement,
        {
          type: 'bar',
          data: {
            labels: statusStats.labels.map((status) =>
              this.labelService.getBookingStatusLabel(status as BookingStatus)
            ),
            datasets: [
              {
                label: 'Nombre de réservations',
                data: statusStats.data,
                backgroundColor: '#36A2EB',
                borderWidth: 2,
              },
            ],
          },
          options: this.getBarChartOptions(),
        }
      );
    }

    // Booking Monthly Chart
    if (this.bookingMonthlyChart?.nativeElement) {
      const timeBasedData = this.getBookingTimeBasedData();

      this.charts['bookingMonthly'] = new Chart(
        this.bookingMonthlyChart.nativeElement,
        {
          type: 'line',
          data: {
            labels: timeBasedData.labels,
            datasets: [
              {
                label: 'Réservations',
                data: timeBasedData.data,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4,
              },
            ],
          },
          options: this.getLineChartOptions(),
        }
      );
    }
  }

  private createOrderCharts() {
    // Order Status Chart
    if (this.orderStatusChart?.nativeElement) {
      const statusStats = this.getOrderStatusStats();

      this.charts['orderStatus'] = new Chart(
        this.orderStatusChart.nativeElement,
        {
          type: 'bar',
          data: {
            labels: statusStats.labels.map((status) =>
              this.labelService.getOrderStatusLabel(status as OrderStatus)
            ),
            datasets: [
              {
                label: 'Nombre de commandes',
                data: statusStats.data,
                backgroundColor: '#FF6384',
                borderWidth: 2,
              },
            ],
          },
          options: this.getBarChartOptions(),
        }
      );
    }

    // Order Monthly Chart
    if (this.orderMonthlyChart?.nativeElement) {
      const timeBasedData = this.getOrderTimeBasedData();

      this.charts['orderMonthly'] = new Chart(
        this.orderMonthlyChart.nativeElement,
        {
          type: 'line',
          data: {
            labels: timeBasedData.labels,
            datasets: [
              {
                label: 'Commandes',
                data: timeBasedData.data,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
              },
            ],
          },
          options: this.getLineChartOptions(),
        }
      );
    }

    // Top Products Chart
    if (this.topProductsChart?.nativeElement) {
      const topProducts = this.getTopProducts();

      this.charts['topProducts'] = new Chart(
        this.topProductsChart.nativeElement,
        {
          type: 'bar',
          data: {
            labels: topProducts.labels,
            datasets: [
              {
                label: 'Quantité vendue',
                data: topProducts.data,
                backgroundColor: '#FFCE56',
                borderWidth: 2,
              },
            ],
          },
          options: {
            ...this.getBarChartOptions(),
            indexAxis: 'y',
          },
        }
      );
    }
  }

  private createSubscriptionCharts() {
    // Subscription Status Chart
    if (this.subscriptionStatusChart?.nativeElement) {
      const statusStats = this.getSubscriptionStatusStats();

      this.charts['subscriptionStatus'] = new Chart(
        this.subscriptionStatusChart.nativeElement,
        {
          type: 'bar',
          data: {
            labels: statusStats.labels,
            datasets: [
              {
                label: "Nombre d'abonnements",
                data: statusStats.data,
                backgroundColor: '#c3ff00',
                borderWidth: 2,
              },
            ],
          },
          options: this.getBarChartOptions(),
        }
      );
    }

    // Subscription Monthly Chart
    if (this.subscriptionMonthlyChart?.nativeElement) {
      const timeBasedData = this.getSubscriptionTimeBasedData();

      this.charts['subscriptionMonthly'] = new Chart(
        this.subscriptionMonthlyChart.nativeElement,
        {
          type: 'line',
          data: {
            labels: timeBasedData.labels,
            datasets: [
              {
                label: 'Abonnements',
                data: timeBasedData.data,
                borderColor: '#c3ff00',
                backgroundColor: 'rgba(195, 255, 0, 0.1)',
                tension: 0.4,
              },
            ],
          },
          options: this.getLineChartOptions(),
        }
      );
    }

    // Subscription Plan Chart
    if (this.subscriptionPlanChart?.nativeElement) {
      const planStats = this.getSubscriptionPlanStats();

      this.charts['subscriptionPlan'] = new Chart(
        this.subscriptionPlanChart.nativeElement,
        {
          type: 'pie',
          data: {
            labels: planStats.labels,
            datasets: [
              {
                data: planStats.data,
                backgroundColor: ['#c3ff00', '#8bc34a', '#4CAF50', '#2E7D32'],
                borderWidth: 2,
              },
            ],
          },
          options: this.getCommonChartOptions(),
        }
      );
    }
  }

  private generateTimeRange(): {
    labels: string[];
    timeIndexes: string[];
    timeUnit: 'day' | 'month';
  } {
    const monthNames = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Jul',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    if (!this.startDate() || !this.endDate()) {
      // Fallback to current year months if no date range
      const currentYear = new Date().getFullYear();
      return {
        labels: monthNames,
        timeIndexes: monthNames.map((_, index) => `${currentYear}-${index}`),
        timeUnit: 'month',
      };
    }

    const startDate = new Date(this.startDate());
    const endDate = new Date(this.endDate());

    // Calculate the number of days in the range
    const daysDiff =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    console.log('Time range analysis:', {
      startDate: this.startDate(),
      endDate: this.endDate(),
      daysDiff,
      willUseDaily: daysDiff <= 31,
    });

    // Use daily view for periods of 31 days or less, monthly for longer periods
    if (daysDiff <= 31) {
      return this.generateDailyRange(startDate, endDate);
    } else {
      return this.generateMonthlyRange(startDate, endDate, monthNames);
    }
  }

  private generateDailyRange(
    startDate: Date,
    endDate: Date
  ): { labels: string[]; timeIndexes: string[]; timeUnit: 'day' } {
    const labels: string[] = [];
    const timeIndexes: string[] = [];

    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDate();
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      const currentYear = new Date().getFullYear();

      // Format: "5/10" for current year, "5/10/24" for other years
      if (year === currentYear) {
        labels.push(`${day}/${month}`);
      } else {
        labels.push(`${day}/${month}/${year.toString().slice(-2)}`);
      }

      // Use YYYY-MM-DD format for indexing
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`;
      timeIndexes.push(dateStr);

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return { labels, timeIndexes, timeUnit: 'day' };
  }

  private generateMonthlyRange(
    startDate: Date,
    endDate: Date,
    monthNames: string[]
  ): { labels: string[]; timeIndexes: string[]; timeUnit: 'month' } {
    const labels: string[] = [];
    const timeIndexes: string[] = [];

    // Start from the beginning of the start month
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      const monthIndex = current.getMonth();
      const year = current.getFullYear();
      const currentYear = new Date().getFullYear();

      // Show year if it's not current year, or if we're spanning multiple years
      if (
        year !== currentYear ||
        startDate.getFullYear() !== endDate.getFullYear()
      ) {
        labels.push(`${monthNames[monthIndex]} ${year}`);
      } else {
        labels.push(monthNames[monthIndex]);
      }

      timeIndexes.push(`${year}-${monthIndex}`);

      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    return { labels, timeIndexes, timeUnit: 'month' };
  }

  private getTimeBasedData() {
    const { labels, timeIndexes, timeUnit } = this.generateTimeRange();

    const bookingsByTime = new Array(labels.length).fill(0);
    const ordersByTime = new Array(labels.length).fill(0);
    const subscriptionsByTime = new Array(labels.length).fill(0);

    this.filteredBookings().forEach((booking) => {
      const itemDate = new Date(booking.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        bookingsByTime[index]++;
      }
    });

    this.filteredOrders().forEach((order) => {
      const itemDate = new Date(order.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        ordersByTime[index]++;
      }
    });

    this.filteredSubscriptions().forEach((transaction) => {
      const itemDate = new Date(transaction.paidAt || transaction.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        subscriptionsByTime[index]++;
      }
    });

    return {
      labels,
      bookings: bookingsByTime,
      orders: ordersByTime,
      subscriptions: subscriptionsByTime,
    };
  }

  private getTimeKey(date: Date, timeUnit: 'day' | 'month'): string {
    if (timeUnit === 'day') {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      // month
      return `${date.getFullYear()}-${date.getMonth()}`;
    }
  }

  private getBookingTypeStats() {
    const types = this.filteredBookings().reduce((acc, booking) => {
      acc[booking.type] = (acc[booking.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(types).map((type) =>
        this.labelService.getBookingTypeLabel(type)
      ),
      data: Object.values(types),
    };
  }

  private getBookingStatusStats() {
    const statuses = this.filteredBookings().reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statuses),
      data: Object.values(statuses),
    };
  }

  private getBookingTimeBasedData() {
    const { labels, timeIndexes, timeUnit } = this.generateTimeRange();
    const data = new Array(labels.length).fill(0);

    this.filteredBookings().forEach((booking) => {
      const itemDate = new Date(booking.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        data[index]++;
      }
    });

    return { labels, data };
  }

  private getOrderStatusStats() {
    const statuses = this.filteredOrders().reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statuses),
      data: Object.values(statuses),
    };
  }

  private getOrderTimeBasedData() {
    const { labels, timeIndexes, timeUnit } = this.generateTimeRange();
    const data = new Array(labels.length).fill(0);

    this.filteredOrders().forEach((order) => {
      const itemDate = new Date(order.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        data[index]++;
      }
    });

    return { labels, data };
  }

  private getTopProducts() {
    const productCounts = {} as Record<string, number>;

    this.filteredOrders().forEach((order) => {
      order.products?.forEach((product: any) => {
        const name = product.productId?.name || 'Produit inconnu';
        productCounts[name] = (productCounts[name] || 0) + product.quantity;
      });
    });

    const sorted = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sorted.map(([name]) => name),
      data: sorted.map(([, count]) => count),
    };
  }

  private getSubscriptionStatusStats() {
    const statuses = this.filteredSubscriptions().reduce((acc, transaction) => {
      acc[transaction.status] = (acc[transaction.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statuses),
      data: Object.values(statuses),
    };
  }

  private getSubscriptionTimeBasedData() {
    const { labels, timeIndexes, timeUnit } = this.generateTimeRange();
    const data = new Array(labels.length).fill(0);

    this.filteredSubscriptions().forEach((transaction) => {
      const itemDate = new Date(transaction.paidAt || transaction.createdAt);
      const timeKey = this.getTimeKey(itemDate, timeUnit);
      const index = timeIndexes.indexOf(timeKey);
      if (index >= 0) {
        data[index]++;
      }
    });

    return { labels, data };
  }

  private getSubscriptionPlanStats() {
    const plans = this.filteredSubscriptions().reduce((acc, transaction) => {
      acc[transaction.plan] = (acc[transaction.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(plans),
      data: Object.values(plans),
    };
  }

  private filterSubscriptionsByDate(
    transactions: SubscriptionTransaction[]
  ): SubscriptionTransaction[] {
    if (!this.startDate() || !this.endDate() || !transactions.length) {
      return transactions;
    }

    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    // Set end time to end of day
    end.setHours(23, 59, 59, 999);

    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(
        transaction.paidAt || transaction.createdAt
      );
      const isInRange = transactionDate >= start && transactionDate <= end;

      return isInRange;
    });

    return filtered;
  }

  // Date filtering methods
  setDatePreset(preset: '7days' | '30days' | '90days' | 'year' | 'custom') {
    this.selectedPreset.set(preset);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case '7days':
        this.startDate.set(
          this.formatDateForInput(
            new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
          )
        );
        this.endDate.set(this.formatDateForInput(today));
        break;
      case '30days':
        this.startDate.set(
          this.formatDateForInput(
            new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
          )
        );
        this.endDate.set(this.formatDateForInput(today));
        break;
      case '90days':
        this.startDate.set(
          this.formatDateForInput(
            new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000)
          )
        );
        this.endDate.set(this.formatDateForInput(today));
        break;
      case 'year':
        this.startDate.set(
          this.formatDateForInput(
            new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000)
          )
        );
        this.endDate.set(this.formatDateForInput(today));
        break;
      case 'custom':
        // Don't change dates for custom, let user set them
        break;
    }

    // Auto-apply for presets (excluding custom)
    if (preset !== 'custom') {
      this.applyDateFilter();
    }
  }

  onStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.startDate.set(target.value);
  }

  onEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.endDate.set(target.value);
  }

  applyDateFilter() {
    // Force chart refresh by calling updateChartsForView
    setTimeout(() => this.updateChartsForView(), 100);
  }

  isDateRangeValid(): boolean {
    if (!this.startDate() || !this.endDate()) return false;
    return new Date(this.startDate()) <= new Date(this.endDate());
  }

  private formatDateForInput(date: Date): string {
    // Use local timezone instead of UTC to avoid date shifting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    return formatted;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private filterDataByDate(data: any[]): any[] {
    if (!this.startDate() || !this.endDate() || !data.length) return data;

    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    // Set end time to end of day
    end.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDate = new Date(item.createdAt || item.date);
      return itemDate >= start && itemDate <= end;
    });
  }
}

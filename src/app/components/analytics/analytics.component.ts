import { Component, OnInit, ViewChild, ElementRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BookingService } from '../../services/booking.service';
import { OrderService } from '../../services/order.service';
import { Booking } from '../../models/booking.model';
import { Order } from '../../models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
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

  bookings = signal<Booking[]>([]);
  orders = signal<Order[]>([]);
  analyticsView = signal<'all' | 'bookings' | 'orders'>('all');

  // Date filtering properties
  selectedPreset = signal<'7days' | '30days' | '90days' | 'year' | 'custom'>('30days');
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Filtered data based on date range
  filteredBookings = computed(() => this.filterDataByDate(this.bookings()));
  filteredOrders = computed(() => this.filterDataByDate(this.orders()));

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
              size: 12
            }
          }
        }
      }
    };
  }

  private getLineChartOptions() {
    return {
      ...this.getCommonChartOptions(),
      scales: {
        x: {
          ticks: {
            color: '#e5e5e5'
          },
          grid: {
            color: '#2a2a2a'
          }
        },
        y: {
          ticks: {
            color: '#e5e5e5'
          },
          grid: {
            color: '#2a2a2a'
          }
        }
      }
    };
  }

  private getBarChartOptions() {
    return {
      ...this.getCommonChartOptions(),
      scales: {
        x: {
          ticks: {
            color: '#e5e5e5'
          },
          grid: {
            color: '#2a2a2a'
          }
        },
        y: {
          ticks: {
            color: '#e5e5e5'
          },
          grid: {
            color: '#2a2a2a'
          }
        }
      }
    };
  }

  // Booking Analytics (using filtered data)
  totalBookings = computed(() => this.filteredBookings().length);
  bookingsRevenue = computed(() =>
    this.filteredBookings().reduce((sum, booking) => sum + (booking.price || 0), 0)
  );
  averageBookingPrice = computed(() => {
    const bookings = this.filteredBookings();
    return bookings.length > 0 ? this.bookingsRevenue() / bookings.length : 0;
  });
  bookingConfirmationRate = computed(() => {
    const bookings = this.filteredBookings();
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    return bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100) : 0;
  });

  // Order Analytics (using filtered data)
  totalOrders = computed(() => this.filteredOrders().length);
  ordersRevenue = computed(() =>
    this.filteredOrders().reduce((sum, order) => sum + (order.totalPrice || 0), 0)
  );
  averageOrderValue = computed(() => {
    const orders = this.filteredOrders();
    return orders.length > 0 ? this.ordersRevenue() / orders.length : 0;
  });
  orderDeliveryRate = computed(() => {
    const orders = this.filteredOrders();
    const delivered = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    return orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;
  });

  constructor(
    private bookingService: BookingService,
    private orderService: OrderService
  ) {
    // Update charts when view changes OR when filtered data changes
    effect(() => {
      // Watch for changes in view, filtered data, or date range
      this.analyticsView();
      this.filteredBookings();
      this.filteredOrders();
      this.startDate();
      this.endDate();

      // Only refresh if we have data and charts are initialized
      if (this.bookings().length > 0 || this.orders().length > 0) {
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
    Object.values(this.charts).forEach(chart => chart?.destroy());
  }

  private loadData() {
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
      },
      error: (error) => console.error('Error loading bookings:', error)
    });

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
      },
      error: (error) => console.error('Error loading orders:', error)
    });
  }

  private initializeCharts() {
    this.updateChartsForView();
  }

  private updateChartsForView() {
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => chart?.destroy());
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
    }
  }

  private createAllAnalyticsCharts() {
    // All Type Chart
    if (this.allTypeChart?.nativeElement) {
      const typeData = {
        labels: ['Réservations', 'Commandes'],
        datasets: [{
          data: [this.totalBookings(), this.totalOrders()],
          backgroundColor: ['#36A2EB', '#FF6384'],
          borderWidth: 2
        }]
      };

      this.charts['allType'] = new Chart(this.allTypeChart.nativeElement, {
        type: 'doughnut',
        data: typeData,
        options: this.getCommonChartOptions()
      });
    }

    // All Monthly Chart
    if (this.allMonthlyChart?.nativeElement) {
      const monthlyData = this.getMonthlyData();

      this.charts['allMonthly'] = new Chart(this.allMonthlyChart.nativeElement, {
        type: 'line',
        data: {
          labels: monthlyData.labels,
          datasets: [
            {
              label: 'Réservations',
              data: monthlyData.bookings,
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.4
            },
            {
              label: 'Commandes',
              data: monthlyData.orders,
              borderColor: '#FF6384',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: this.getLineChartOptions()
      });
    }
  }

  private createBookingCharts() {
    // Booking Type Chart
    if (this.bookingTypeChart?.nativeElement) {
      const typeStats = this.getBookingTypeStats();

      this.charts['bookingType'] = new Chart(this.bookingTypeChart.nativeElement, {
        type: 'pie',
        data: {
          labels: typeStats.labels,
          datasets: [{
            data: typeStats.data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            borderWidth: 2
          }]
        },
        options: this.getCommonChartOptions()
      });
    }

    // Booking Status Chart
    if (this.bookingStatusChart?.nativeElement) {
      const statusStats = this.getBookingStatusStats();

      this.charts['bookingStatus'] = new Chart(this.bookingStatusChart.nativeElement, {
        type: 'bar',
        data: {
          labels: statusStats.labels,
          datasets: [{
            label: 'Nombre de réservations',
            data: statusStats.data,
            backgroundColor: '#36A2EB',
            borderWidth: 2
          }]
        },
        options: this.getBarChartOptions()
      });
    }

    // Booking Monthly Chart
    if (this.bookingMonthlyChart?.nativeElement) {
      const monthlyData = this.getBookingMonthlyData();

      this.charts['bookingMonthly'] = new Chart(this.bookingMonthlyChart.nativeElement, {
        type: 'line',
        data: {
          labels: monthlyData.labels,
          datasets: [{
            label: 'Réservations par mois',
            data: monthlyData.data,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.4
          }]
        },
        options: this.getLineChartOptions()
      });
    }
  }

  private createOrderCharts() {
    // Order Status Chart
    if (this.orderStatusChart?.nativeElement) {
      const statusStats = this.getOrderStatusStats();

      this.charts['orderStatus'] = new Chart(this.orderStatusChart.nativeElement, {
        type: 'bar',
        data: {
          labels: statusStats.labels,
          datasets: [{
            label: 'Nombre de commandes',
            data: statusStats.data,
            backgroundColor: '#FF6384',
            borderWidth: 2
          }]
        },
        options: this.getBarChartOptions()
      });
    }

    // Order Monthly Chart
    if (this.orderMonthlyChart?.nativeElement) {
      const monthlyData = this.getOrderMonthlyData();

      this.charts['orderMonthly'] = new Chart(this.orderMonthlyChart.nativeElement, {
        type: 'line',
        data: {
          labels: monthlyData.labels,
          datasets: [{
            label: 'Commandes par mois',
            data: monthlyData.data,
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.4
          }]
        },
        options: this.getLineChartOptions()
      });
    }

    // Top Products Chart
    if (this.topProductsChart?.nativeElement) {
      const topProducts = this.getTopProducts();

      this.charts['topProducts'] = new Chart(this.topProductsChart.nativeElement, {
        type: 'bar',
        data: {
          labels: topProducts.labels,
          datasets: [{
            label: 'Quantité vendue',
            data: topProducts.data,
            backgroundColor: '#FFCE56',
            borderWidth: 2
          }]
        },
        options: {
          ...this.getBarChartOptions(),
          indexAxis: 'y'
        }
      });
    }
  }

  private getMonthlyData() {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const bookingsByMonth = new Array(12).fill(0);
    const ordersByMonth = new Array(12).fill(0);

    this.filteredBookings().forEach(booking => {
      const month = new Date(booking.createdAt).getMonth();
      bookingsByMonth[month]++;
    });

    this.filteredOrders().forEach(order => {
      const month = new Date(order.createdAt).getMonth();
      ordersByMonth[month]++;
    });

    return {
      labels: months,
      bookings: bookingsByMonth,
      orders: ordersByMonth
    };
  }

  private getBookingTypeStats() {
    const types = this.filteredBookings().reduce((acc, booking) => {
      acc[booking.type] = (acc[booking.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(types),
      data: Object.values(types)
    };
  }

  private getBookingStatusStats() {
    const statuses = this.filteredBookings().reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statuses),
      data: Object.values(statuses)
    };
  }

  private getBookingMonthlyData() {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = new Array(12).fill(0);

    this.filteredBookings().forEach(booking => {
      const month = new Date(booking.createdAt).getMonth();
      data[month]++;
    });

    return { labels: months, data };
  }

  private getOrderStatusStats() {
    const statuses = this.filteredOrders().reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statuses),
      data: Object.values(statuses)
    };
  }

  private getOrderMonthlyData() {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = new Array(12).fill(0);

    this.filteredOrders().forEach(order => {
      const month = new Date(order.createdAt).getMonth();
      data[month]++;
    });

    return { labels: months, data };
  }

  private getTopProducts() {
    const productCounts = {} as Record<string, number>;

    this.filteredOrders().forEach(order => {
      order.products?.forEach((product: any) => {
        const name = product.productId?.name || 'Produit inconnu';
        productCounts[name] = (productCounts[name] || 0) + product.quantity;
      });
    });

    const sorted = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      labels: sorted.map(([name]) => name),
      data: sorted.map(([, count]) => count)
    };
  }

  // Date filtering methods
  setDatePreset(preset: '7days' | '30days' | '90days' | 'year' | 'custom') {
    this.selectedPreset.set(preset);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case '7days':
        this.startDate.set(this.formatDateForInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)));
        this.endDate.set(this.formatDateForInput(today));
        break;
      case '30days':
        this.startDate.set(this.formatDateForInput(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)));
        this.endDate.set(this.formatDateForInput(today));
        break;
      case '90days':
        this.startDate.set(this.formatDateForInput(new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000)));
        this.endDate.set(this.formatDateForInput(today));
        break;
      case 'year':
        this.startDate.set(this.formatDateForInput(new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000)));
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
    return date.toISOString().split('T')[0];
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private filterDataByDate(data: any[]): any[] {
    if (!this.startDate() || !this.endDate() || !data.length) return data;

    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    // Set end time to end of day
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date);
      return itemDate >= start && itemDate <= end;
    });
  }
}
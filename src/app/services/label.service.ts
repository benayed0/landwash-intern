import { Injectable } from '@angular/core';
import {
  BookingStatus,
  BookingType,
  carType,
  colorTone,
} from '../models/booking.model';
import { OrderStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  /**
   * Get the French label for a booking type
   * @param type The booking type
   * @returns The French label for the booking type
   */
  getBookingTypeLabel(type: BookingType | string): string {
    const labels: Record<string, string> = {
      detailing: 'Lavage Détaillé',
      salon: 'Salon',
      paint_correction: 'Correction de Peinture',
      body_correction: 'Correction de Carrosserie',
      ceramic_coating: 'Revêtement Céramique',
    };
    return labels[type] || type;
  }

  /**
   * Get the French label for a car type
   * @param carType The car type
   * @returns The French label for the car type
   */
  getCarTypeLabel(carType: carType | string): string {
    const labels: Record<string, string> = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      pickup: 'Pick-up',
    };
    return labels[carType] || carType;
  }

  /**
   * Get the icon/emoji for a booking type
   * @param type The booking type
   * @returns The emoji representing the booking type
   */
  getBookingTypeIcon(type: BookingType | string): string {
    const icons: Record<string, string> = {
      detailing: '🚗',
      salon: '🛌',
      paint_correction: '🎨',
      body_correction: '🔧',
      ceramic_coating: '✨',
    };
    return icons[type] || '📋';
  }

  /**
   * Get all available booking types with their labels and icons
   * @returns Array of booking types with labels and icons
   */
  getAllBookingTypes(): { value: BookingType; label: string; icon: string }[] {
    return [
      {
        value: 'detailing',
        label: this.getBookingTypeLabel('detailing'),
        icon: this.getBookingTypeIcon('detailing'),
      },
      {
        value: 'salon',
        label: this.getBookingTypeLabel('salon'),
        icon: this.getBookingTypeIcon('salon'),
      },
      {
        value: 'paint_correction',
        label: this.getBookingTypeLabel('paint_correction'),
        icon: this.getBookingTypeIcon('paint_correction'),
      },
      {
        value: 'body_correction',
        label: this.getBookingTypeLabel('body_correction'),
        icon: this.getBookingTypeIcon('body_correction'),
      },
      {
        value: 'ceramic_coating',
        label: this.getBookingTypeLabel('ceramic_coating'),
        icon: this.getBookingTypeIcon('ceramic_coating'),
      },
    ];
  }

  /**
   * Get all available car types with their labels
   * @returns Array of car types with labels
   */
  getAllCarTypes(): { value: carType; label: string }[] {
    return [
      { value: 'small', label: this.getCarTypeLabel('small') },
      { value: 'big', label: this.getCarTypeLabel('big') },
      { value: 'pickup', label: this.getCarTypeLabel('pickup') },
    ];
  }

  /**
   * Check if a booking type requires color tone input
   * @param type The booking type
   * @returns True if color tone is relevant for this booking type
   */
  requiresColorTone(type: BookingType | string): boolean {
    return ['paint_correction', 'body_correction', 'ceramic_coating'].includes(
      type
    );
  }

  /**
   * Check if a booking type requires car type input
   * @param type The booking type
   * @returns True if car type is required for this booking type
   */
  requiresCarType(type: BookingType | string): boolean {
    return type !== 'salon';
  }

  /**
   * Get the French label for a color tone
   * @param colorTone The color tone
   * @returns The French label for the color tone
   */
  getColorToneLabel(colorTone: colorTone | string): string {
    const labels: Record<string, string> = {
      clear: 'Clair',
      medium_clear: 'Moyen Clair',
      dark: 'Foncé',
    };
    return labels[colorTone] || colorTone;
  }

  /**
   * Get the icon/emoji for a color tone
   * @param colorTone The color tone
   * @returns The emoji representing the color tone
   */
  getColorToneIcon(colorTone: colorTone | string): string {
    const icons: Record<string, string> = {
      clear: '⚪',
      medium_clear: '🔵',
      dark: '⚫',
    };
    return icons[colorTone] || '🎨';
  }

  /**
   * Get all available color tones with their labels and icons
   * @returns Array of color tones with labels and icons
   */
  getAllColorTones(): { value: colorTone; label: string; icon: string }[] {
    return [
      {
        value: 'clear',
        label: this.getColorToneLabel('clear'),
        icon: this.getColorToneIcon('clear'),
      },
      {
        value: 'medium_clear',
        label: this.getColorToneLabel('medium_clear'),
        icon: this.getColorToneIcon('medium_clear'),
      },
      {
        value: 'dark',
        label: this.getColorToneLabel('dark'),
        icon: this.getColorToneIcon('dark'),
      },
    ];
  }

  getBookingStatusLabel(status: BookingStatus) {
    const labels: Record<string, string> = {
      pending: 'En Attente',
      confirmed: 'Confirmé',
      'in-progress': 'En Cours',
      completed: 'Terminé',
      rejected: 'Refusé',
      canceled: 'Annulé',
    };
    return labels[status] || status;
  }
  getOrderStatusLabel(status: OrderStatus): string {
    const labels: Record<string, string> = {
      pending: 'En Attente',
      confirmed: 'Confirmé',
      shipped: 'Expédié',
      delivered: 'Livré',
      paid: 'Payé',
      cancelled: 'Annulé',
      completed: 'Terminé',
    };
    return labels[status] || status;
  }
}

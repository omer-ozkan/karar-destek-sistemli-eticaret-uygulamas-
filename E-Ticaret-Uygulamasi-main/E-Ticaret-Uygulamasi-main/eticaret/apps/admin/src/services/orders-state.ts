import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { OrderModel } from '@shared/models/order.model';
import { FlexiToastService } from 'flexi-toast';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class OrdersStateService {
  readonly version = signal(0);

  readonly #http = inject(HttpClient);
  readonly #toast = inject(FlexiToastService);

  updateStatus(order: OrderModel, status: string): void {
    if (!order.id) {
      return;
    }

    this.#http.patch(`${API_URL}/orders/${order.id}`, { status }).subscribe({
      next: () => {
        this.#toast.showToast('Başarılı', 'Sipariş durumu güncellendi.', 'success');
        this.version.update((value) => value + 1);
      },
      error: () => {
        this.#toast.showToast('Hata', 'Durum güncellenirken hata oluştu.', 'error');
      },
    });
  }

  markAsShipped(order: OrderModel): void {
    this.updateStatus(order, 'Kargoya Verildi');
  }
}

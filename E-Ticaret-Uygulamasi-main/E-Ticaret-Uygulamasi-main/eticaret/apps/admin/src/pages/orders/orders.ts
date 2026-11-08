import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Blank from '../../components/blank/blank';
import { API_URL } from '../../constants';
import {
  normalizeOrderStatus,
  ORDER_STATUSES,
  OrderModel,
} from '@shared/models/order.model';
import { FlexiGridFilterDataModel, FlexiGridModule } from 'flexi-grid';
import { TrCurrencyPipe } from 'tr-currency';
import { OrdersStateService } from '../../services/orders-state';

function orderTotal(order: OrderModel): number {
  return (order.baskets ?? []).reduce(
    (sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 1),
    0
  );
}

@Component({
  imports: [Blank, FlexiGridModule, DatePipe, FormsModule, TrCurrencyPipe],
  templateUrl: './orders.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Orders {
  readonly statuses = ORDER_STATUSES;
  readonly statusFilter = computed<FlexiGridFilterDataModel[]>(() =>
    this.statuses.map((status) => ({ name: status, value: status }))
  );
  readonly #ordersState = inject(OrdersStateService);
  readonly result = httpResource<OrderModel[]>(() => {
    this.#ordersState.version();
    return `${API_URL}/orders`;
  });
  readonly data = computed(() =>
    [...(this.result.value() ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );
  readonly loading = computed(() => this.result.isLoading());

  orderAmount(order: OrderModel): number {
    return orderTotal(order);
  }

  displayStatus(status: string): string {
    return normalizeOrderStatus(status);
  }

  statusBadgeClass(status: string): string {
    switch (normalizeOrderStatus(status)) {
      case 'Kargoya Verildi':
        return 'bg-info';
      case 'Teslim Edildi':
        return 'bg-success';
      case 'İptal Edildi':
        return 'bg-danger';
      default:
        return 'bg-warning text-dark';
    }
  }

  changeStatus(order: OrderModel, status: string): void {
    this.#ordersState.updateStatus(order, status);
  }

  markAsShipped(order: OrderModel): void {
    this.#ordersState.markAsShipped(order);
  }
}

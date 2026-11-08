import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { Common } from '../../services/common';
import { httpResource } from '@angular/common/http';
import { normalizeOrderStatus, OrderModel } from '@shared/models/order.model';
import { TrCurrencyPipe } from 'tr-currency';

function orderTotal(order: OrderModel): number {
  return (order.baskets ?? []).reduce(
    (sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 1),
    0
  );
}

@Component({
  imports: [
    DatePipe,
    TrCurrencyPipe,
    CommonModule
  ],

  templateUrl: './orders.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Orders {
  readonly limit = signal<number>(4);
  readonly result = httpResource<OrderModel[]>(() => {
    const userId = this.#common.user()?.id;
    if (!userId) {
      return undefined;
    }

    return `/API_URL/orders?userId=${userId}`;
  });
  readonly loading = computed(() => this.result.isLoading());
  readonly allOrders = computed(() =>
    [...(this.result.value() ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );
  readonly data = computed(() => this.allOrders().slice(0, this.limit()));
  readonly totalCount = computed(() => this.allOrders().length);
  readonly waitingCount = computed(() =>
    this.allOrders().filter((order) => {
      const status = normalizeOrderStatus(order.status);
      return status === 'Hazırlanıyor' || status === 'Kargoya Verildi';
    }).length
  );
  readonly completedCount = computed(() =>
    this.allOrders().filter((order) => normalizeOrderStatus(order.status) === 'Teslim Edildi').length
  );
  readonly hasMore = computed(() => this.limit() < this.allOrders().length);

  readonly #common = inject(Common);

  displayStatus(status: string): string {
    return normalizeOrderStatus(status);
  }

  orderAmount(order: OrderModel): number {
    return orderTotal(order);
  }

  showMore(){
    this.limit.update(prev => prev + 4);
  }
}

import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Blank from '../../components/blank/blank';
import { API_URL } from '../../constants';
import { CategoryModel } from '@shared/models/category.model';
import {
  normalizeOrderStatus,
  ORDER_STATUSES,
  OrderModel,
} from '@shared/models/order.model';
import { ProductModel } from '@shared/models/product.model';
import { UserModel } from '@shared/models/user.model';
import { TrCurrencyPipe } from 'tr-currency';
import { OrdersStateService } from '../../services/orders-state';
import { UsersStateService } from '../../services/users-state';

function orderTotal(order: OrderModel): number {
  return (order.baskets ?? []).reduce(
    (sum, item) => sum + (item.productPrice ?? 0) * (item.quantity ?? 1),
    0
  );
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Blank, TrCurrencyPipe, DatePipe, RouterLink, FormsModule],
  templateUrl: './home.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  readonly statuses = ORDER_STATUSES;

  readonly #ordersState = inject(OrdersStateService);
  readonly #usersState = inject(UsersStateService);

  readonly usersResult = httpResource<UserModel[]>(() => {
    this.#usersState.version();
    return `${API_URL}/users`;
  });
  readonly ordersResult = httpResource<OrderModel[]>(() => {
    this.#ordersState.version();
    return `${API_URL}/orders`;
  });
  readonly productsResult = httpResource<ProductModel[]>(() => `${API_URL}/products`);
  readonly categoriesResult = httpResource<CategoryModel[]>(() => `${API_URL}/categories`);

  readonly users = computed(() =>
    [...(this.usersResult.value() ?? [])].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'tr')
    )
  );
  readonly orders = computed(() => this.ordersResult.value() ?? []);
  readonly products = computed(() => this.productsResult.value() ?? []);
  readonly categories = computed(() => this.categoriesResult.value() ?? []);

  readonly loading = computed(
    () =>
      this.usersResult.isLoading() ||
      this.ordersResult.isLoading() ||
      this.productsResult.isLoading() ||
      this.categoriesResult.isLoading()
  );

  readonly totalRevenue = computed(() =>
    this.orders().reduce((sum, order) => sum + orderTotal(order), 0)
  );
  readonly totalOrders = computed(() => this.orders().length);
  readonly totalProducts = computed(() => this.products().length);
  readonly totalUsers = computed(() => this.users().length);
  readonly shippingCount = computed(
    () =>
      this.orders().filter((order) => normalizeOrderStatus(order.status) === 'Kargoya Verildi')
        .length
  );

  readonly recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  readonly topProducts = computed(() => {
    const map = new Map<
      string,
      { name: string; categoryName: string; quantity: number; revenue: number }
    >();

    for (const order of this.orders()) {
      for (const item of order.baskets ?? []) {
        const key = item.productId ?? item.productName ?? 'unknown';
        const product = this.products().find((p) => p.id === item.productId);
        const current = map.get(key) ?? {
          name: item.productName ?? 'Bilinmeyen',
          categoryName: product?.categoryName ?? '-',
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity ?? 1;
        current.revenue += (item.productPrice ?? 0) * (item.quantity ?? 1);
        map.set(key, current);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  readonly topCustomers = computed(() => {
    const map = new Map<string, { name: string; orderCount: number; spent: number }>();

    for (const order of this.orders()) {
      const key = order.userId ?? order.fullName;
      const current = map.get(key) ?? { name: order.fullName, orderCount: 0, spent: 0 };
      current.orderCount++;
      current.spent += orderTotal(order);
      map.set(key, current);
    }

    return Array.from(map.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  });

  refresh(): void {
    this.usersResult.reload();
    this.ordersResult.reload();
    this.productsResult.reload();
    this.categoriesResult.reload();
  }

  orderAmount(order: OrderModel): number {
    return orderTotal(order);
  }

  orderStatusLabel(status: string): string {
    return normalizeOrderStatus(status);
  }

  orderStatusClass(status: string): string {
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

  canMarkAsShipped(status: string): boolean {
    return normalizeOrderStatus(status) === 'Hazırlanıyor';
  }

  changeStatus(order: OrderModel, status: string): void {
    this.#ordersState.updateStatus(order, status);
  }

  markAsShipped(order: OrderModel): void {
    this.#ordersState.markAsShipped(order);
  }
}

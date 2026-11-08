/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Common } from '../../services/common';
import { BasketModel } from '@shared/models/basket.model';
import { TrCurrencyPipe } from 'tr-currency';
import {OrderModel , initialOrder} from '@shared/models/order.model'
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask'
import { FlexiSelectModule } from 'flexi-select';

@Component({
  imports: [
    RouterLink,
    TrCurrencyPipe,
    FormsModule,
    DatePipe,
    NgxMaskDirective,
    FlexiSelectModule
  ],
  templateUrl: './payment.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Payment {
  readonly result = httpResource<BasketModel[]>(() => `/API_URL/baskets?userId=${this.#common.user()?.id}`)
  readonly baskets = computed(() => this.result.value() ?? []);
  readonly total = computed(() => {
    let val = 0;
    this.baskets().forEach((res) => {
      val += res.productPrice * res.quantity;
    });

    return val;
  });

  readonly kdv = computed(() => (this.total() * 18) / 100);
  readonly data = signal<OrderModel>({...initialOrder});
  readonly showSuccessPart = signal<boolean>(false);
  readonly term = signal<boolean>(false);
  readonly cityResult = httpResource<any>(() => "/il-ilce.json");
  readonly cities = computed(() => this.cityResult.value() ?? []);
  readonly districts = signal<any>([]);

  readonly #common = inject(Common);
  readonly #http = inject(HttpClient);

  pay(form : NgForm){
    console.log('Form valid:', form.valid);
    console.log('Form data:', this.data());
    if(!form.valid) return;


    this.data.update(prev => ({
      ...prev,
      userId: this.#common.user()!.id!,
      orderNumber: `TS-${new Date().getFullYear()}-${new Date().getTime()}`,
      date: new Date(),
      status: "Hazırlanıyor",
      baskets: [...this.baskets()]
    }));
    console.log('Updated data:', this.data());
    this.#http.post("/API_URL/orders",this.data()).subscribe({
      next: (res) => {
        console.log('Order created successfully:', res);
        this.showSuccessPart.set(true);
        this.baskets().forEach(val => {
          this.#http.delete(`/API_URL/baskets/${val.id}`).subscribe();
        });
        this.#common.basketCount.set(0);
      },
      error: (error) => {
        console.error('Error creating order:', error);
      }
    });
  }
  setDistricts(){
    const city = this.cities().find((p: any) => p.il_adi === this.data().city);
    this.districts.set(city.ilceler);
  }
}

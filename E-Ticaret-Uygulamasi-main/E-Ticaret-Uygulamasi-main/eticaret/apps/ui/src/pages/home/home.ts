/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, signal, untracked, ViewEncapsulation } from '@angular/core';
import { ProductModel } from '@shared/models/product.model'
import { TrCurrencyPipe} from 'tr-currency';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ActivatedRoute } from '@angular/router';
import { Common } from '../../services/common';
import { BasketModel } from '@shared/models/basket.model'
import { FlexiToastService } from 'flexi-toast';


@Component({
  imports: [
    TrCurrencyPipe,
    InfiniteScrollDirective,
  ],
  templateUrl: './home.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Home {
  readonly placeholderCount = signal<number[]>([1,2,3]);
  readonly categoryUrl = signal<string | undefined>(undefined);
  readonly categoryUrlPrev = this.computedPrevious(this.categoryUrl);
  readonly displayCount = signal<number>(6)
  readonly result = httpResource<ProductModel[]>(() => {
    let endpoind = `/API_URL/products`;
    if(this.categoryUrl()){
      endpoind += `?categoryUrl=${this.categoryUrl()}`;
    }
    return endpoind;
  });

  readonly data = computed(() => this.result.value() ?? []);
  readonly dataSignal = computed(() => this.data().slice(0, this.displayCount()));
  readonly loading = computed(() => this.result.isLoading());
  readonly user = computed(() => this.#common.user());

  readonly #http = inject(HttpClient);
  readonly #activated = inject(ActivatedRoute);
  readonly #common = inject(Common)
  readonly #toast = inject(FlexiToastService);


  constructor(){
    this.#activated.params.subscribe(res => {
      if(res['categoryUrl']){
        this.categoryUrl.set(res['categoryUrl'])
      }
    });

    effect(() => {
      if(this.categoryUrlPrev() !== this.categoryUrl()){
        this.displayCount.set(6);
      }
    })
  }

  onScroll(){
    this.displayCount.update(prev => prev + 6);
  }

  computedPrevious<T>(s: Signal<T>): Signal<T>{
    let current = null as T;
    let previous = untracked(() => s());

    return computed(() => {
      current = s();
      const result = previous;
      previous = current;
       return result;
    });
  }

  addBasket(data: ProductModel){
    const basket: BasketModel = {
      userId: this.#common.user()!.id!,
      productId: data.id!,
      productName: data.name,
      productPrice: data.price,
      productImageUrl: data.imageUrl,
      quantity: 1
    };
      this.#http.post("/API_URL/baskets", basket).subscribe((res) => {
        this.#toast.showToast("Başarılı", "Ürün sepete başırıyla eklendi");
        this.#common.basketCount.update(prev => prev + 1);
      });
  }
}

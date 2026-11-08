import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import Blank from '../../components/blank/blank';
import { FlexiGridFilterDataModel, FlexiGridModule } from 'flexi-grid';
import { HttpClient, httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import {CategoryModel} from '@shared/models/category.model';
import { ProductModel } from '@shared/models/product.model';


@Component({
  imports: [
    Blank,
    FlexiGridModule,
    RouterLink,
  ],
  templateUrl: './products.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Products {
  readonly result = httpResource<ProductModel[]>(() => "/API_URL/products");
  readonly data = computed(() => this.result.value() ?? []);
  readonly loading = computed(() => this.result.isLoading());

  readonly categoryResult = httpResource<CategoryModel[]>(() => "/API_URL/categories")
  readonly categoryFilter = computed<FlexiGridFilterDataModel[]>(() => {
    const categories = this.categoryResult.value() ?? [];
    return categories.map<FlexiGridFilterDataModel>((val) => ({name:val.name, value:val.name}))
  });

  readonly #toast= inject(FlexiToastService);
  readonly #http = inject(HttpClient);

  delete(id:string){
    console.log('Silinecek ürün id:', id);
    if (!id) {
      this.#toast.showToast("Hata", "Silinecek ürünün id'si yok!", "error");
      return;
    }

    this.#toast.showSwal("ürünü sil?","Ürünü silmek istediğinize emin misiniz?","Sil",()=> {
      this.#http.delete(`/API_URL/products/${id}`).subscribe({
        next: () => {
          this.result.reload();
          this.#toast.showToast("Başarılı", "Ürün başarıyla silindi.", "success");
        },
        error: (err) => {
          console.error('Silme hatası:', err);
          this.#toast.showToast("Hata", "Ürün silinirken hata oluştu.", "error");
        }
      });
    });
  }
}

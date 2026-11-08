import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import Blank from '../../components/blank/blank';
import { FlexiGridModule } from 'flexi-grid';
import { RouterLink } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import { CategoryModel } from '@shared/models/category.model';

@Component({
  imports: [
    FlexiGridModule,
    Blank,
    RouterLink,
  ],

  templateUrl: './categories.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})


export default class Categories {
  readonly result = httpResource<CategoryModel[]>(() => "/API_URL/categories");

  readonly data = computed(() => this.result.value() ?? []);
  readonly loading = computed(() => this.result.isLoading());
  readonly #http = inject(HttpClient)
  readonly #toast = inject(FlexiToastService);

  delete(id: string) {
    console.log('Silinecek kategori id:', id);
    if (!id) {
      this.#toast.showToast("Hata", "Silinecek kategorinin id'si yok!", "error");
      return;
    }

    this.#toast.showSwal("Kategori Silinsin mi?", "Bu işlem geri alınamaz!", "Sil",()=> {
      this.#http.delete(`/API_URL/categories/${id}`).subscribe({
        next: () => {
          this.result.reload();
          this.#toast.showToast("Başarılı", "Kategori başarıyla silindi.", "success");
        },
        error: (err) => {
          console.error('Silme hatası:', err);
          this.#toast.showToast("Hata", "Kategori silinirken hata oluştu.", "error");
        }
      });
    });
  }
}

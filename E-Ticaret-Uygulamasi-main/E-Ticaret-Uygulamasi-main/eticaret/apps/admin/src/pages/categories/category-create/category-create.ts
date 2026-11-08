import { ChangeDetectionStrategy, Component, computed, inject, resource, signal, ViewEncapsulation } from '@angular/core';
import Blank from '../../../components/blank/blank';
import { FormsModule, NgForm } from '@angular/forms';
import { CategoryModel, initialCategory } from '@shared/models/category.model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FlexiToastService } from 'flexi-toast';
import { lastValueFrom } from 'rxjs';
import { BreadcrumbModel } from '../../../services/common';

@Component({
  imports: [
    Blank,
    FormsModule
  ],
  templateUrl: './category-create.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class CategoryCreate {

  readonly id = signal<string | undefined>(undefined);
   readonly breadcrumbs = signal<BreadcrumbModel[]>([
      {title: 'Kategoriler', url: '/categories', icon: 'category'},
    ])
  readonly title = computed(() => this.id() ? 'Kategoriyi Güncelle' : 'Kategori Ekle');
  readonly btnName = computed(() => this.id() ? 'Güncelle' : 'Kaydet');

  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      const res = await lastValueFrom(this.#http.get<CategoryModel>(`/API_URL/categories/${this.id()}`));
       this.breadcrumbs.update(prev => [...prev,   {title: res.name, url:`/categories/edit/${this.id}`, icon: 'edit'}],);
    return res;
    }
  })
  readonly data = computed(() => this.result.value() ?? {...initialCategory});

  readonly #http = inject(HttpClient);
  readonly #toast = inject(FlexiToastService);
  readonly #activated = inject(ActivatedRoute);
  readonly #router = inject(Router);

  constructor(){
    this.#activated.params.subscribe((res) => {
      if(res['id']) {
        this.id.set(res['id']);
        // Burada id'ye göre veriyi çekebiliyoruz
        // Örneğin: this.#http.get<CategoryModel>(`/API_URL/categories/${this.id()}`).subscribe(data => this.data.set(data));
      }else{
        this.breadcrumbs.update(prev => [...prev,   {title: 'Ekle', url:'/categories/category-create', icon: 'add'}],)
      }
    });
  }

  save(form: NgForm){
    if(!form.valid) return;

    console.log('Form değeri:', form.value);
    if(!this.id()) {
      // Yeni kategori ekleme işlemi - id'yi çıkar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...categoryData } = this.data();
      console.log('Gönderilecek veri:', categoryData);

      this.#http.post("/API_URL/categories", categoryData).subscribe({
        next: () => {
          this.#toast.showToast("Başarılı", "Kategori başarıyla eklendi.", "success");
          this.#router.navigateByUrl('/categories');

        },
        error: (err) => {
          console.error('Kategori ekleme hatası:', err);
          this.#toast.showToast("Hata", "Kategori eklenirken hata oluştu.", "error");
        }
      });
    } else {
      // Kategori güncelleme işlemi
      this.#http.put(`/API_URL/categories/${this.id()}`, this.data()).subscribe({
        next: () => {
          this.#toast.showToast("Başarılı", "Kategori başarıyla güncellendi.", "success");
          this.#router.navigateByUrl('/categories');
        },
        error: (err) => {
          console.error('Kategori güncelleme hatası:', err);
          this.#toast.showToast("Hata", "Kategori güncellenirken hata oluştu.", "error");
        }
      });
    }
  }

}

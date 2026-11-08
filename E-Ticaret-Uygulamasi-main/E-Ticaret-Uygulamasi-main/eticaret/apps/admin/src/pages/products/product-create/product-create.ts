import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, resource, signal, ViewEncapsulation } from '@angular/core';
import Blank from '../../../components/blank/blank';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, httpResource } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import { NgxMaskDirective } from 'ngx-mask';
import { lastValueFrom } from 'rxjs';
import { initialProduct, ProductModel } from '@shared/models/product.model';
import { CategoryModel } from '@shared/models/category.model';
import { FlexiSelectModule } from 'flexi-select';
import { BreadcrumbModel } from '../../../services/common';
//import { Location } from '@angular/common';

@Component({
  imports: [
    Blank,
    FormsModule,
    NgxMaskDirective,
    FlexiSelectModule
  ],
  templateUrl: './product-create.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ProductCreate {
  readonly id  = signal<string | undefined>(undefined); // id parametresini almak için kullanılır
  readonly breadcrumbs = signal<BreadcrumbModel[]>([
  {title: 'Ürünler', url: '/products', icon: 'store'},
])
  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      const res = await lastValueFrom(this.#http.get<ProductModel>(`/API_URL/products/${this.id()}`));
        this.breadcrumbs.update(prev => [...prev, {title: res.name, url: `/products/edit/${this.id()}`, icon: 'edit'},]);
      return res;
    }
  });

  readonly data = linkedSignal(() => this.result.value() ?? {...initialProduct});
  readonly title = computed(() =>this.id() ? 'Ürünü Güncelle' : 'Ürün Ekle');
  readonly btnName = computed(() => this.id() ? 'Güncelle' : 'Kaydet');

  readonly categoryResult = httpResource<CategoryModel[]>(() => "/API_URL/categories")
  readonly categories = computed(() => this.categoryResult.value() ?? [] );
  readonly categoryLoading = computed(() => this.categoryResult.isLoading());

  readonly #http = inject(HttpClient);
  readonly #router = inject(Router);
  //readonly #location = inject(Location);
  readonly #toast = inject(FlexiToastService);
  readonly #activate = inject(ActivatedRoute)

  constructor() {
   this.#activate.params.subscribe(res => {
     if(res['id']) {
      this.id.set(res['id']);
     }else{
      this.breadcrumbs.update(prev => [...prev,  {title: 'Ekle', url: '/products/product-create', icon: 'add'}])
     }
   });
  }

  save(form:NgForm){
    if(!form.valid) return
    console.log(form.value);

    // Form verilerini hazırla
    const formData = {
      ...this.data(),
      price: this.data().price ? Number(this.data().price) : 0,
      stock: this.data().stock ? Number(this.data().stock) : 0
    };

    if(!this.id()) {
      // id'yi çıkar, sadece diğer alanları gönder
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...productData } = formData;
      this.#http.post("/API_URL/products", productData).subscribe(() => {
      this.#router.navigate(['/products']);
      this.#toast.showToast("Başarılı","Ürün başarıyla eklendi.","success");

      //this.#location.back(); // buraya gelmeden önceki sayfaya geri dönüş yapar
    });
    }else{
      this.#http.put(`/API_URL/products/${this.id()}`, formData).subscribe(() => {
      this.#router.navigate(['/products']);
      this.#toast.showToast("Başarılı","Ürün başarıyla güncellendi.","info");

      //this.#location.back(); // buraya gelmeden önceki sayfaya geri dönüş yapar
    });
    }
  }

  setCategoryName(){
    const id = this.data().categoryId;
    const category = this.categories().find(p => p.id == id);
    this.data.update((prev) => ({...prev, categoryName: category?.name ?? "" , categoryUrl: category?.url ?? ""}));
  }
}
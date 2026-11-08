import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, resource, signal, ViewEncapsulation } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { initialUser, UserModel } from '@shared/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import { FormsModule, NgForm } from '@angular/forms';
import Blank from '../../../components/blank/blank';
import { API_URL } from '../../../constants';
import { BreadcrumbModel } from '../../../services/common';
import { UsersStateService } from '../../../services/users-state';
@Component({
  imports: [
    Blank,
    FormsModule
  ],
  templateUrl: './users-create.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class UsersCreate {
  readonly id = signal<string | undefined >(undefined);

  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {title: 'Kullanıcılar', url: '/users', icon: 'group'},
  ])

  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      const res = await lastValueFrom(this.#http.get<UserModel>(`${API_URL}/users/${this.id()}`));
          this.breadcrumbs.update(prev => [...prev,   {title: 'Güncelle', url:`/users/edit/${this.id}`, icon: 'edit'}],);
      return res;
    }
  });
  readonly data = linkedSignal(() => this.result.value() ?? {...initialUser});
  readonly title = computed(() => this.id() ? 'Kullanıcı Güncelle' : 'Kullanıcı Ekle');
  readonly btnName = computed(() => this.id() ? 'Güncelle' : 'Kaydet');

  readonly #http = inject(HttpClient);
  readonly #activated = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #toast = inject(FlexiToastService);
  readonly #usersState = inject(UsersStateService);

  constructor(){
    this.#activated.params.subscribe(res => {
      if(res['id']){
        this.id.set(res['id']);
      }else{
        this.breadcrumbs.update(prev => [...prev,   {title: 'Ekle', url:'/users/users-create', icon: 'add'}],)
      }
    });
  }

  save(form:NgForm){
    if(!form.valid) return;

    this.data.update((prev) => ({...prev, fullName: `${prev.firstName}  ${prev.lastName}`}));
    if(!this.id()){
      this.#http.post(`${API_URL}/users`, this.data()).subscribe(() => {
        this.#usersState.notifyChange();
        this.#toast.showToast("Başarılı", "Kullanıcı başarıyla kaydedildi");
        this.#router.navigateByUrl("/users")
      });
    }else{
       this.#http.put(`${API_URL}/users/${this.id()}`, this.data()).subscribe(() => {
        this.#usersState.notifyChange();
        this.#toast.showToast("Başarılı", "Kullanıcı başarıyla güncellendi");
        this.#router.navigateByUrl("/users")
      });
    }
  }


}

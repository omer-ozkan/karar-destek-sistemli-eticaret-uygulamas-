import { HttpClient, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import Blank from '../../components/blank/blank';
import { FlexiGridModule } from 'flexi-grid';
import { FlexiToastService } from 'flexi-toast';
import { RouterModule } from '@angular/router';
import { API_URL } from '../../constants';
import { FormsModule } from '@angular/forms';
import { UserModel} from '@shared/models/user.model'
import { UsersStateService } from '../../services/users-state';

@Component({
  imports: [
    Blank,
    FlexiGridModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './users.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Users {

  readonly result = httpResource<UserModel[]>(() => {
    this.#usersState.version();
    return `${API_URL}/users`;
  });
  readonly data = computed(() => this.result.value() ?? []);
  readonly loading = computed(() => this.result.isLoading());
  readonly #toast = inject(FlexiToastService);
  readonly #http = inject(HttpClient);
  readonly #usersState = inject(UsersStateService);

  delete(id:string){
    this.#toast.showSwal("Kullanıcıyı sil","Kullanıcıyı Silmek İstiyor musunuz","sil", () => {
      this.#http.delete(`${API_URL}/users/${id}`).subscribe(() => {
        this.#usersState.notifyChange();
        this.result.reload();
      })
    })
  }

  changeIsAdmin(data:UserModel){
    this.#http.put(`${API_URL}/users/${data.id}`, data).subscribe(() => {
    this.#usersState.notifyChange();
    this.result.reload();
  });
  }
}

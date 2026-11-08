import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserModel } from '@shared/models/user.model';
import { Common } from '../../../services/common';
import { FlexiToastService } from 'flexi-toast';

@Component({
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Login {
  readonly #http = inject(HttpClient);
  readonly #toast = inject(FlexiToastService);
  readonly #router = inject(Router);
  readonly #common = inject(Common);

  signIn(form: NgForm){
    if(!form.valid) return;

    const userName = encodeURIComponent(form.value['userName']);
    const password = form.value['password'];
    this.#http.get<UserModel[]>(`/API_URL/users?userName=${userName}`).subscribe(res => {
      if(res.length===0){
        this.#toast.showToast("Hata", "Kullanıcı adı ya da şifre yanlış", "error");
        return;
      }
      const user = res[0];
      if(user.password !== password){
        this.#toast.showToast("Hata", "Kullanıcı adı ya da şifre yanlış", "error");
        return;
      }
      localStorage.setItem("response" , JSON.stringify(user));
      this.#router.navigateByUrl("/");
      this.#common.setUser(user);

    })
  }

}

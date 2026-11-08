import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { API_URL } from '../../constants'
import { UserModel } from '@shared/models/user.model';
import { FlexiToastService } from 'flexi-toast';
import { Router } from '@angular/router';

@Component({
  imports: [
    FormsModule,
  ],
  templateUrl: './login.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Login {
  readonly #http = inject(HttpClient);
  readonly #toast = inject(FlexiToastService);
  readonly #router = inject(Router);


  signIn(form: NgForm){
    if(!form.valid) return;

    const userName = encodeURIComponent(form.value['userName']);
    const password = form.value['password'];
    this.#http.get<UserModel[]>(`${API_URL}/users?userName=${userName}`).subscribe(res => {
      if(res.length===0){
        this.#toast.showToast("Hata", "Kullanıcı adı ya da şifre yanlış", "error");
        return;
      }
      const user = res[0];
      if(user.password !== password){
        this.#toast.showToast("Hata", "Kullanıcı adı ya da şifre yanlış", "error");
        return;
      }
      if(!user.isAdmin){
        this.#toast.showToast("Hata", "Bu kullanıcının giriş yapmaya yetkisi yok", "error");
        return;
      }
      this.#toast.showToast("Hoş Geldiniz!", "Başarıyla giriş yaptınız. Yönlendiriliyorsunuz...", "success");
      localStorage.setItem("response", JSON.stringify(user));
      this.#router.navigateByUrl("/");
   });
  }
}

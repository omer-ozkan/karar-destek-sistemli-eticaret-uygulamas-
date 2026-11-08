import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FlexiToastService } from 'flexi-toast';

@Injectable({
  providedIn: 'root'
})
export class Error {
  readonly #toast = inject(FlexiToastService);

  handler(err: HttpErrorResponse){
    console.log(err);

    switch(err.status){
      case 400:
        this.#toast.showToast("hata", err.message, "error")
        break;
      case 500:
        this.#toast.showToast("hata", err.message, "error")
        break;
    }
  }
} 
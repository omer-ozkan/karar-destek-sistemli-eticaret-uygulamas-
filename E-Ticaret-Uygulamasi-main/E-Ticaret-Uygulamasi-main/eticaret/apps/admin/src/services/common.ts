import { Injectable, signal } from '@angular/core';
import { UserModel } from '@shared/models/user.model';

// Define BreadcrumbModel or import it from its module
export interface BreadcrumbModel {
  title: string;
  url: string;
  icon: string
}

@Injectable({
  providedIn: 'root'
})
export class Common {
  readonly data = signal<BreadcrumbModel[]>([]);
  readonly user = signal<UserModel | undefined>(undefined)

  constructor(){
    const response: string | null = localStorage.getItem("response");
    if(response){
      this.user.set(JSON.parse(response));
    }
  }

    set(data : BreadcrumbModel[]){
      const val :  BreadcrumbModel = {
        title: "Ana Sayfa",
        url: "/",
        icon: "home"
      }
      this.data.set([val, ...data]);
}


}

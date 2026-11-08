import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import Breadcrump from './breadcrumb/breadcrumb';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {navigations } from '../../navigation';
import { NavPipe } from '../pipes/nav-pipe';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Common } from '../../services/common';

@Component({
  imports: [
    Breadcrump,
    RouterLink,
    RouterLinkActive,
    NavPipe,
    FormsModule,
    DatePipe,
    RouterOutlet
  ],
  templateUrl: './layouts.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Layouts {
  readonly search = signal<string>("");
  readonly time = signal<Date | string>("");
  readonly navigations = computed(() => navigations);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  readonly user = computed(() => this.#common.user()!);

  readonly #router = inject(Router);
  readonly #common = inject(Common)

  constructor(){
    setInterval(()=> {
      this.time.set(new Date())
    },1000);
  }

  logout()
  {
    localStorage.clear();
    this.#common.user.set(undefined);
    this.#router.navigateByUrl("/login");
  }

}

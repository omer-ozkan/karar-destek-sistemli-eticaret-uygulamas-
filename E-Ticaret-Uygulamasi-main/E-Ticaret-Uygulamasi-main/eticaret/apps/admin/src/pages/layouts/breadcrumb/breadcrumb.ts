import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Common } from 'apps/admin/src/services/common';


interface BreadcrumbModel {
  title: string;
  url: string;
  icon: string;
}


@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class BreadcrumbM {
  readonly data = computed(()=> this.#common.data());

  readonly #common = inject(Common);
}

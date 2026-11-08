import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { BreadcrumbModel, Common } from '../../services/common';


@Component({
  selector: 'app-blank',
  imports: [],
  templateUrl: './blank.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Blank implements OnChanges{

  readonly pageTitle = input.required<string>();
  readonly breadcrumbs = input.required<BreadcrumbModel[]>();

  readonly #common = inject(Common);

   ngOnChanges(changes: SimpleChanges): void {
      this.#common.set(this.breadcrumbs());

  }

}

import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UsersStateService {
  readonly version = signal(0);

  notifyChange(): void {
    this.version.update((value) => value + 1);
  }
}

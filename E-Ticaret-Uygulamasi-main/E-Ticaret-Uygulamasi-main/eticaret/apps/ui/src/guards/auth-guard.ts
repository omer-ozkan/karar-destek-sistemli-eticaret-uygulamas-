import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserModel } from '@shared/models/user.model';
import { Common } from '../services/common';

export const authGuard: CanActivateFn = () => {
  const response = localStorage.getItem('response');

  if (!response) {
    inject(Router).navigateByUrl('/');
    return false;
  }

  const common = inject(Common);
  if (!common.user()) {
    common.setUser(JSON.parse(response) as UserModel);
  }

  return true;
};

import { Routes } from "@angular/router";

const routes : Routes = [
    {
        path: '',
        loadComponent: () => import('./users')
    },
    {
        path: 'create',
        loadComponent: () => import('./users-create/users-create')
    },
    {
        path: ':id',
        loadComponent: () => import('./users-create/users-create')
    }
]

export default routes;
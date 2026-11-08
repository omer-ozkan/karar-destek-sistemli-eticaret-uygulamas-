import { Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: "",
        loadComponent: () => import('./categories')
    },
    {
        path: "create",
        loadComponent: () => import('./category-create/category-create')
    },
    {
        path: ":id/edit",
        loadComponent: () => import('./category-create/category-create')
    }
]

export default routes;
import { Routes } from "@angular/router";

export  const routes: Routes = [

            {
                path: '',
                loadComponent: () => import('./products')
            },
            {
                path: 'product-create',
                loadComponent: () => import('./product-create/product-create')
            },
            {
                path: 'product-edit/:id',
                loadComponent: () => import('./product-create/product-create')
            }

]

export default routes;
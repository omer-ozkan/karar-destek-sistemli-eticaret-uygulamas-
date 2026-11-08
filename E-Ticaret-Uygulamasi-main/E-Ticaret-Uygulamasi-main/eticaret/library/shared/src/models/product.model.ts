export interface ProductModel{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description: any;
  id : string;
  name : string;
  imageUrl : string;
  price : number;
  stock : number;
  categoryId: string;
  categoryName: string;
  categoryUrl: string;
}

export const initialProduct: ProductModel = {
  id: "",
  name: "",
  imageUrl: "",
  price: null as never,
  stock: null as never,
  categoryId: "",
  categoryName: "",
  categoryUrl: "",
  description: undefined
}
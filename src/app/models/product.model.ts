export interface OneProduct {
  _id: string;
  type: string;
  name: string;
  pictures?: string[];
  price: number;
  details: string;
  instructions_of_use?: string;
}
export interface Product extends OneProduct {
  nested_products?: Product[];
}

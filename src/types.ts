export type ProductCategory = 'butter' | 'balm' | 'set';

export type OrderStatus = 'new' | 'preparing' | 'delivered';

export type Language = 'kk' | 'ru';

export interface Product {
  id: string;
  name: string;
  nameRu?: string;
  category: ProductCategory;
  price: number;
  unit: string;
  shortDescription: string;
  shortDescriptionRu?: string;
  description: string;
  descriptionRu?: string;
  ingredients?: string;
  ingredientsRu?: string;
  usage?: string;
  usageRu?: string;
  imageUrl: string;
  inStock: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryType: 'local_delivery' | 'pickup';
  paymentMethod: 'cash_on_delivery' | 'kaspi_transfer';
  comment?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface StoreSettings {
  deliveryNote: string;
  deliveryNoteRu: string;
  freeDeliveryThreshold: number;
  contactPhone: string;
  storeAddress: string;
  storeAddressRu: string;
}

import type { Product } from '@/data/products';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const productsUrl = `${apiBaseUrl}/products`;

export type NewProduct = Omit<Product, 'id'>;

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read';
  createdAt: string;
}

export type NewContactMessage = Pick<
  ContactMessage,
  'name' | 'phone' | 'email' | 'subject' | 'message'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  if (
    !isRecord(value) ||
    !isRecord(value.specs) ||
    (value.specIcons !== undefined &&
      (!isRecord(value.specIcons) ||
        !Object.values(value.specIcons).every((icon) => typeof icon === 'string')))
  ) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    ['phones', 'appliances', 'accessories'].includes(String(value.category)) &&
    typeof value.brand === 'string' &&
    typeof value.price === 'number' &&
    typeof value.originalPrice === 'number' &&
    typeof value.rating === 'number' &&
    typeof value.reviews === 'number' &&
    typeof value.isBestSeller === 'boolean' &&
    typeof value.image === 'string' &&
    typeof value.description === 'string' &&
    Object.values(value.specs).every((spec) => typeof spec === 'string')
  );
}

function isContactMessage(value: unknown): value is ContactMessage {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.email === 'string' &&
    typeof value.subject === 'string' &&
    typeof value.message === 'string' &&
    (value.status === 'new' || value.status === 'read') &&
    typeof value.createdAt === 'string'
  );
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error('Backend returned an invalid response.');
  }
}

function responseMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message;
  }
  return `Backend request failed (${status}).`;
}

async function adminRequest(path: string, method: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Request': '1',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  return payload;
}

async function uploadCloudinaryImage(file: File, path: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/uploads/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': file.type,
      'X-Admin-Request': '1',
    },
    body: file,
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  if (!isRecord(payload) || payload.success !== true || typeof payload.url !== 'string') {
    throw new Error('Backend returned invalid Cloudinary upload data.');
  }

  return payload.url;
}

export function uploadSpecificationIcon(file: File): Promise<string> {
  return uploadCloudinaryImage(file, 'specification-icon');
}

export function uploadProductImage(file: File): Promise<string> {
  return uploadCloudinaryImage(file, 'product-image');
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(productsUrl, { cache: 'no-store' });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !Array.isArray(payload.products) ||
    !payload.products.every(isProduct)
  ) {
    throw new Error('Backend returned invalid product data.');
  }

  return payload.products;
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const response = await fetch(`${productsUrl}/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  const payload = await readResponse(response);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  if (!isRecord(payload) || payload.success !== true || !isProduct(payload.product)) {
    throw new Error('Backend returned invalid product data.');
  }

  return payload.product;
}

export async function checkAdminSession(): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/admin/session`, {
    credentials: 'include',
    cache: 'no-store',
    headers: { 'X-Admin-Request': '1' },
  });
  if (response.status === 401) return false;

  const payload = await readResponse(response);
  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  return isRecord(payload) && payload.success === true && payload.authenticated === true;
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  await adminRequest('/admin/login', 'POST', { email, password });
}

export async function submitContactMessage(message: NewContactMessage): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  const payload = await readResponse(response);
  if (!response.ok) {
    throw new Error(responseMessage(payload, response.status));
  }
  if (!isRecord(payload) || payload.success !== true || !isContactMessage(payload.message)) {
    throw new Error('Backend returned invalid contact message data.');
  }
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const payload = await adminRequest('/contact', 'GET');
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !Array.isArray(payload.messages) ||
    !payload.messages.every(isContactMessage)
  ) {
    throw new Error('Backend returned invalid contact message data.');
  }
  return payload.messages;
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessage['status']
): Promise<ContactMessage> {
  const payload = await adminRequest(`/contact/${encodeURIComponent(id)}`, 'PATCH', { status });
  if (!isRecord(payload) || payload.success !== true || !isContactMessage(payload.message)) {
    throw new Error('Backend returned invalid contact message data.');
  }
  return payload.message;
}

export async function deleteContactMessage(id: string): Promise<void> {
  const payload = await adminRequest(`/contact/${encodeURIComponent(id)}`, 'DELETE');
  if (!isRecord(payload) || payload.success !== true) {
    throw new Error('Backend returned an invalid contact message delete response.');
  }
}

export async function logoutAdmin(): Promise<void> {
  await adminRequest('/admin/logout', 'POST');
}

export async function createProduct(product: NewProduct): Promise<Product> {
  const payload = await adminRequest('/products', 'POST', product);
  if (!isRecord(payload) || payload.success !== true || !isProduct(payload.product)) {
    throw new Error('Backend returned invalid product data.');
  }
  return payload.product;
}

export async function updateProduct(id: string, product: NewProduct): Promise<Product> {
  const payload = await adminRequest(`/products/${encodeURIComponent(id)}`, 'PATCH', product);
  if (!isRecord(payload) || payload.success !== true || !isProduct(payload.product)) {
    throw new Error('Backend returned invalid product data.');
  }
  return payload.product;
}

export async function deleteProduct(id: string): Promise<void> {
  const payload = await adminRequest(`/products/${encodeURIComponent(id)}`, 'DELETE');
  if (!isRecord(payload) || payload.success !== true) {
    throw new Error('Backend returned an invalid delete response.');
  }
}

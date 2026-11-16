import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import ProductDetails from '@/components/ProductDetails';
import { fetchProduct } from '@/lib/products-api';

export const dynamic = 'force-dynamic';

const getProduct = cache(fetchProduct);

interface ProductPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product ? `${product.title} | BT Sales India` : 'Product Not Found | BT Sales India',
    description: product?.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}

import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api/products';
import type { FilterParams } from '@/types/dtos';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: FilterParams = {
    search: searchParams.get('search') || undefined,
    gesture: searchParams.get('gesture') || undefined,
    territory: searchParams.get('territory') || undefined,
    sort: (searchParams.get('sort') as FilterParams['sort']) || undefined,
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 12,
  };

  try {
    const data = await getProducts(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

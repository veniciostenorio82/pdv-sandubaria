import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json(
      products.map((product) => ({
        id: product.externalId,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        emoji: product.emoji,
        category: product.category.slug,
      }))
    );
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

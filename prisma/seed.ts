import { PrismaClient } from '@prisma/client';
import { products } from '../src/lib/data';

const prisma = new PrismaClient();

const categoryLabels: Record<string, { name: string }> = {
  lanche: { name: 'Sanduíches' },
  acompanhamento: { name: 'Acompanhamentos' },
  bebida: { name: 'Bebidas' },
};

async function main() {
  for (const [slug, meta] of Object.entries(categoryLabels)) {
    await prisma.productCategory.upsert({
      where: { slug },
      update: { name: meta.name },
      create: { slug, name: meta.name },
    });
  }

  const categoryMap = new Map(
    (await prisma.productCategory.findMany()).map((category) => [category.slug, category.id])
  );

  for (const product of products) {
    const categoryId = categoryMap.get(product.category);

    if (!categoryId) {
      continue;
    }

    await prisma.product.upsert({
      where: { externalId: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        emoji: product.emoji,
        categoryId,
      },
      create: {
        externalId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        emoji: product.emoji,
        categoryId,
      },
    });
  }

  console.log(`Seed concluído: ${products.length} itens adicionados/atualizados.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

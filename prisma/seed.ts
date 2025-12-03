import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.sample.createMany({
    data: [
      { name: 'Sample A', price: 10.5 },
      { name: 'Sample B', price: 20 },
      { name: 'Sample C', price: 15.75 },
    ],
  });

  const allSamples = await prisma.sample.findMany();
  console.log('Seeded Samples:', allSamples);
}

main()
  .catch(async (e) => {
    console.error('Error seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

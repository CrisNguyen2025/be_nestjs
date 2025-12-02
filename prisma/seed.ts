import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.mock.createMany({
    data: [
      { name: 'Mock A', price: 10.5 },
      { name: 'Mock B', price: 20 },
      { name: 'Mock C', price: 15.75 },
    ],
  });

  const allMocks = await prisma.mock.findMany();
  console.log('Seeded Mocks:', allMocks);
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

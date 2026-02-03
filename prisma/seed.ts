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

  // Create a default user for testing
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: 'hashed_password_here', // In real app, hash this
      role: 'USER',
      emailVerified: true,
    },
  });
  console.log('Seeded User:', user);

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

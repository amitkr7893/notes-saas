const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password', 10);

  const acme = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { slug: 'acme', name: 'Acme', plan: 'FREE' },
  });

  const globex = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: { slug: 'globex', name: 'Globex', plan: 'FREE' },
  });

  // users
  await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: {
      email: 'admin@acme.test',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@acme.test' },
    update: {},
    create: {
      email: 'user@acme.test',
      password: passwordHash,
      role: 'MEMBER',
      tenantId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@globex.test' },
    update: {},
    create: {
      email: 'admin@globex.test',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: globex.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@globex.test' },
    update: {},
    create: {
      email: 'user@globex.test',
      password: passwordHash,
      role: 'MEMBER',
      tenantId: globex.id,
    },
  });

  // optionally add sample notes
  await prisma.note.createMany({
    data: [
      { title: 'Welcome Acme', content:'First note', tenantId: acme.id, ownerId: (await prisma.user.findUnique({where:{email:'admin@acme.test'}})).id },
      { title: 'Welcome Globex', content:'First note', tenantId: globex.id, ownerId: (await prisma.user.findUnique({where:{email:'admin@globex.test'}})).id },
    ],
  });

  console.log('Seed complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());

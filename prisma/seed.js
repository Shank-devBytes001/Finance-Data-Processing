import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@zorvyn.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin12345!';

  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      password: hash,
      role: 'ADMIN',
      isActive: true,
    },
    update: {},
  });

  const analystEmail = 'analyst@zorvyn.local';
  const viewerEmail = 'viewer@zorvyn.local';

  await prisma.user.upsert({
    where: { email: analystEmail },
    create: {
      email: analystEmail,
      password: hash,
      role: 'ANALYST',
      isActive: true,
    },
    update: { password: hash, role: 'ANALYST' },
  });

  await prisma.user.upsert({
    where: { email: viewerEmail },
    create: {
      email: viewerEmail,
      password: hash,
      role: 'VIEWER',
      isActive: true,
    },
    update: { password: hash, role: 'VIEWER' },
  });

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const analyst = await prisma.user.findUnique({ where: { email: analystEmail } });

  if (admin && (await prisma.record.count()) === 0) {
    await prisma.record.createMany({
      data: [
        {
          userId: admin.id,
          amount: 5000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date(),
          notes: 'Seed income',
        },
        {
          userId: analyst.id,
          amount: 120,
          type: 'EXPENSE',
          category: 'Food',
          date: new Date(),
          notes: 'Lunch',
        },
        {
          userId: admin.id,
          amount: 45.5,
          type: 'EXPENSE',
          category: 'Transport',
          date: new Date(),
          notes: 'Taxi',
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log(`  Admin:   ${adminEmail} / ${adminPassword}`);
  console.log(`  Analyst: ${analystEmail} / ${adminPassword}`);
  console.log(`  Viewer:  ${viewerEmail} / ${adminPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

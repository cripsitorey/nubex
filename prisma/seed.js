import { PrismaClient } from '../src/generated/prisma-client/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nubex.com' },
    update: {},
    create: {
      nombre: 'Admin Nubex',
      email: 'admin@nubex.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin creado:', admin.email);

  await prisma.configFidelidad.upsert({
    where: { id: 1 },
    update: {},
    create: { comprasNecesarias: 6, tipoRecompensa: 'VAPE_GRATIS' },
  });
  console.log('Config fidelidad creada');

  const modelo = await prisma.vapeModelo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Elfbar 600',
      marca: 'Elfbar',
      descripcion: 'Vape desechable 600 puffs',
      puffs: 600,
      costo: 4.5,
      precioVendedor: 6,
      precioSugerido: 8,
      variantes: {
        create: [
          { sabor: 'Blue Razz Ice', stock: 20 },
          { sabor: 'Mango', stock: 15 },
          { sabor: 'Watermelon Ice', stock: 10 },
        ],
      },
    },
  });
  console.log('Modelo demo creado:', modelo.nombre);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

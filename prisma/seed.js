import "dotenv/config";
import bcrypt from "bcrypt";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    // Verificar si ya existe un admin
    const existing = await client.query(
      `SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`
    );

    if (existing.rows.length > 0) {
      console.log("⚠️  Ya existe un usuario ADMIN (id:", existing.rows[0].id, ")");
      console.log("   Si quieres crear otro, elimina el existente primero.");
      return;
    }

    const password = await bcrypt.hash("admin123", 10);

    const result = await client.query(
      `INSERT INTO "User" (nombre, cedula, telefono, email, password, role, "totalVapesComprados", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, nombre, email, role`,
      ["Admin Nubex", "V-00000000", "0000000000", "admin@nubex.com", password, "ADMIN", 0]
    );

    const admin = result.rows[0];
    console.log("");
    console.log("✅ Usuario ADMIN creado exitosamente:");
    console.log("───────────────────────────────────");
    console.log("   Nombre:     ", admin.nombre);
    console.log("   Email:      ", admin.email);
    console.log("   Cédula:      V-00000000");
    console.log("   Contraseña:  admin123");
    console.log("   Rol:        ", admin.role);
    console.log("───────────────────────────────────");
    console.log("");
    console.log("🔑 Puedes logearte con:");
    console.log("   Identificador: admin@nubex.com (o V-00000000)");
    console.log("   Password:      admin123");
    console.log("");
  } catch (error) {
    console.error("❌ Error creando admin:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

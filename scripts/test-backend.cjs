// Prueba opcional: PostgreSQL embebido, sin modificar dependencias del frontend.
// La herramienta externa se instala por separado; ver docs/BACKEND-SUPABASE.md.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
async function main() {
  const runtime = process.env.FLORIST_PGLITE_PATH;
  if (!runtime) throw Error('Define FLORIST_PGLITE_PATH con la ruta al módulo PGlite. No se descargan herramientas automáticamente.');
  const { PGlite } = require(path.resolve(runtime));
  const db = await PGlite.create();
  try {
    // Dobles del contrato de Supabase Auth. No simulan contraseñas, JWT firmados ni HTTP.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
          nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid;
      $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
    `);
    const dir = path.join(root, 'supabase/migrations');
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
      await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
      console.log('Migración aplicada: ' + file);
    }
    let total = 0;
    for (const file of fs.readdirSync(path.join(root, 'supabase/tests')).filter(f => f.endsWith('.sql')).sort()) {
      const results = await db.exec(fs.readFileSync(path.join(root, 'supabase/tests', file), 'utf8'));
      const report = results.flatMap(r => r.rows || []).find(r => 'passed_assertions' in r);
      if (!report) throw Error('No se recibió el resultado de las pruebas SQL: ' + file);
      total += Number(report.passed_assertions);
      console.log(file + ': ' + report.passed_assertions + ' comprobaciones aprobadas.');
    }
    console.log('SQL: ' + total + ' comprobaciones aprobadas en PostgreSQL embebido.');
    console.log('Pendiente: Supabase Auth real, API HTTP, correo y concurrencia con conexiones múltiples.');
  } finally {
    await db.close();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

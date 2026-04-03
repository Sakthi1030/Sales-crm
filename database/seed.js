/**
 * database/seed.js — Nexus CRM Seed Script
 *
 * Generates realistic sample data:
 *   - 6 users (1 admin + 5 sales reps)
 *   - 30 customers with interaction histories
 *   - 50 leads in various stages
 *   - 30 deals across all pipeline stages
 *   - 25 tasks (mix of done/pending)
 *
 * Usage:  node database/seed.js
 */

const path = require('path');
process.env.NODE_PATH = path.join(__dirname, '..', 'backend', 'node_modules');
require('module').Module._initPaths();

require('dotenv').config({ path: '../backend/.env' });
const bcrypt = require('bcryptjs');
const { pool } = require('../backend/config/db');

// ── Data pools ─────────────────────────────────────────────
const FIRST_NAMES = ['Alex','Jordan','Morgan','Taylor','Casey','Riley','Jamie','Avery','Quinn','Blake','Drew','Skyler','Reese','Cameron','Dakota','Emerson','Finley','Harper','Jesse','Kennedy','Logan','Mason','Olive','Parker','Robin','Sam','Sloane','Tatum','Sage','River'];
const LAST_NAMES  = ['Anderson','Thompson','Martinez','Johnson','Williams','Brown','Davis','Garcia','Wilson','Lee','Taylor','Harris','Jackson','Lewis','Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green','Adams','Baker','Nelson','Carter','Mitchell'];
const COMPANIES   = ['Apex Solutions','BlueSky Tech','Cascade Systems','Delta Analytics','Echo Media','Frontier Digital','Gravity Labs','Horizon AI','Ignite Ventures','Jetstream Inc','Keystone Corp','Luminary Group','Meridian Co','Orbit Technologies','Pinnacle LLC','Quantum Works','Redwood Systems','Stellar Inc','Titan Dynamics','Uplift Agency','Vertex Cloud','Wavelength Media','Xenith Corp','Yonder Labs','Zenith Group','Cobalt Systems','Dusk Analytics','Empower Tech','Flare Digital','Gemstone Data'];
const INDUSTRIES  = ['Technology','Finance','Healthcare','Retail','Manufacturing','Education','Media','Real Estate'];
const SOURCES     = ['Website','Referral','LinkedIn','Cold Call','Email Campaign','Event'];
const INTERACTION_TYPES = ['Email sent','Call completed','Demo scheduled','Contract reviewed','Support ticket resolved','Renewal discussion','Onboarding session','Quarterly business review'];
const DEAL_NAMES  = ['Enterprise Platform License','Pro Suite Annual','Growth Package','Starter Bundle','Custom Integration Project','API License Agreement','Premium Support Plan','Cloud Migration','Data Analytics Suite','Marketing Automation'];
const TASK_TITLES = ['Follow up after demo','Send proposal document','Schedule onboarding call','Review contract terms','Check in on renewal','Send case study','Update CRM notes','Quarterly business review prep','Prepare demo environment','Respond to support ticket','Send invoice','Confirm meeting time','Research prospect background','Handoff to customer success','Collect NPS feedback','Cold outreach: new prospects','LinkedIn connection request','Product walkthrough','Trial extension approval','Negotiate contract terms'];

// ── Helpers ────────────────────────────────────────────────
const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd     = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const genEmail = (fn, ln, co) => `${fn.toLowerCase()}.${ln.toLowerCase()}@${co.toLowerCase().replace(/[^a-z]/g,'').slice(0,12)}.com`;
const genPhone = () => `+1 (${rnd(200,999)}) ${rnd(200,999)}-${rnd(1000,9999)}`;
const fmtDate  = d => d.toISOString().split('T')[0];

async function seed() {
  console.log('\n🌱 Starting Nexus CRM seed...\n');

  // ── 0. Load schema ───────────────────────────────────────
  const fs = require('fs');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('✅ Schema applied');

  // ── 1. Clear existing data (order matters for FK) ────────
  await pool.query('TRUNCATE tasks, interactions, deals, leads, customers, users CASCADE');
  console.log('✅ Tables cleared');

  // ── 2. Seed users ─────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  const userDefs = [
    { name: 'Alex Kim',      email: 'admin@nexuscrm.io',  hash: adminHash, role: 'admin', color: 'accent' },
    { name: 'Sarah Chen',    email: 'sarah@nexuscrm.io',  hash,            role: 'rep',   color: 'green'  },
    { name: 'Marcus Webb',   email: 'marcus@nexuscrm.io', hash,            role: 'rep',   color: 'purple' },
    { name: 'Priya Patel',   email: 'priya@nexuscrm.io',  hash,            role: 'rep',   color: 'amber'  },
    { name: 'Devon Clark',   email: 'devon@nexuscrm.io',  hash,            role: 'rep',   color: 'teal'   },
    { name: 'Zoe Martinez',  email: 'zoe@nexuscrm.io',    hash,            role: 'rep',   color: 'pink'   },
  ];

  const userIds = [];
  for (const u of userDefs) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, avatar_color)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [u.name, u.email, u.hash, u.role, u.color]
    );
    userIds.push(res.rows[0].id);
  }
  const repIds = userIds.slice(1); // exclude admin
  console.log(`✅ ${userIds.length} users created`);

  // ── 3. Seed customers ─────────────────────────────────────
  const customerIds = [];
  for (let i = 0; i < 30; i++) {
    const fn = pick(FIRST_NAMES), ln = pick(LAST_NAMES), co = COMPANIES[i];
    const since = randDate(new Date(2021, 0, 1), new Date(2023, 11, 31));
    const res = await pool.query(
      `INSERT INTO customers (name, email, phone, company, industry, lifetime_value, account_manager, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        `${fn} ${ln}`, genEmail(fn, ln, co), genPhone(), co,
        pick(INDUSTRIES), rnd(10000, 300000), pick(repIds),
        since.toISOString(),
      ]
    );
    customerIds.push(res.rows[0].id);

    // Log 3–7 interactions per customer
    for (let j = 0; j < rnd(3, 7); j++) {
      const iDate = randDate(since, new Date());
      await pool.query(
        `INSERT INTO interactions (customer_id, type, notes, created_by, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [res.rows[0].id, pick(INTERACTION_TYPES), 'Auto-generated interaction note.', pick(repIds), iDate.toISOString()]
      );
    }
  }
  console.log(`✅ 30 customers + interactions created`);

  // ── 4. Seed leads ─────────────────────────────────────────
  const statuses  = ['new','new','new','contacted','contacted','qualified','lost'];
  const priorities = ['high','medium','medium','low'];
  for (let i = 0; i < 50; i++) {
    const fn = pick(FIRST_NAMES), ln = pick(LAST_NAMES), co = pick(COMPANIES);
    const created = randDate(new Date(2024, 0, 1), new Date());
    await pool.query(
      `INSERT INTO leads (name, email, phone, company, status, priority, source, value, assigned_to, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        `${fn} ${ln}`, genEmail(fn, ln, co), genPhone(), co,
        pick(statuses), pick(priorities), pick(SOURCES),
        rnd(2000, 80000), pick(repIds), pick(repIds), created.toISOString(),
      ]
    );
  }
  console.log(`✅ 50 leads created`);

  // ── 5. Seed deals ─────────────────────────────────────────
  const stageDist  = { prospect: 8, qualified: 7, negotiation: 6, closed: 9 };
  const probMap    = { prospect: [10, 30], qualified: [40, 60], negotiation: [65, 85], closed: [100, 100] };
  for (const [stage, count] of Object.entries(stageDist)) {
    for (let i = 0; i < count; i++) {
      const [pMin, pMax] = probMap[stage];
      const closeDate    = randDate(new Date(), new Date(2025, 8, 30));
      const created      = randDate(new Date(2024, 0, 1), new Date());
      await pool.query(
        `INSERT INTO deals (name, company, value, stage, probability, close_date, assigned_to, created_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          pick(DEAL_NAMES), pick(COMPANIES), rnd(5000, 150000), stage,
          rnd(pMin, pMax), fmtDate(closeDate), pick(repIds), pick(repIds), created.toISOString(),
        ]
      );
    }
  }
  console.log(`✅ 30 deals created`);

  // ── 6. Seed tasks ──────────────────────────────────────────
  for (let i = 0; i < 25; i++) {
    const dueDate = randDate(new Date(2024, 10, 1), new Date(2025, 5, 30));
    await pool.query(
      `INSERT INTO tasks (title, done, priority, due_date, link_type, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        pick(TASK_TITLES),
        Math.random() > 0.55,          // ~45% done
        pick(['High','Medium','Medium','Low']),
        fmtDate(dueDate),
        pick(['lead','customer','deal']),
        pick(repIds), pick(repIds),
      ]
    );
  }
  console.log(`✅ 25 tasks created`);

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Admin:    admin@nexuscrm.io  /  admin123');
  console.log('   Sales Rep: sarah@nexuscrm.io  /  password123\n');
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

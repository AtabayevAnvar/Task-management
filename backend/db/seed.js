/* ============================================
   SEED — Insert initial data into database
   ============================================ */

const bcrypt = require('bcryptjs');
const { initDatabase, dbWrapper } = require('./database');

async function seed() {
  console.log('🌱 Seeding database...');

  await initDatabase();
  const db = dbWrapper;

  // ── Check if already seeded ──
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount && parseInt(userCount.count, 10) > 0) {
    console.log('⚠️  Database already has data. Skipping seed.');
    process.exit(0);
  }

  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  // ══════════════════════════════════════
  // USERS — 3 roles: admin, pm, employee
  // ══════════════════════════════════════
  const users = [
    ['Anvar Atabayev',    'admin@taskflow.uz',   hash('admin123'),  'admin',    'AA', '#3b82f6', 'CTO',                    'online'],
    ['Dilshod Karimov',   'dilshod@taskflow.uz', hash('pm123'),     'pm',       'DK', '#8b5cf6', 'Project Manager',        'online'],
    ['Madina Rahimova',   'madina@taskflow.uz',  hash('pm123'),     'pm',       'MR', '#ec4899', 'Project Manager',        'offline'],
    ['Jasur Toshmatov',   'jasur@taskflow.uz',   hash('emp123'),    'employee', 'JT', '#f59e0b', 'Team Lead (Frontend)',   'online'],
    ['Nodira Azimova',    'nodira@taskflow.uz',  hash('emp123'),    'employee', 'NA', '#34d399', 'Full-stack Developer',   'online'],
    ['Shaxzod Aliyev',    'shaxzod@taskflow.uz', hash('emp123'),    'employee', 'ShA','#60a5fa', 'Backend Developer',      'busy'],
    ['Gulnora Usmonova',  'gulnora@taskflow.uz', hash('emp123'),    'employee', 'GU', '#a78bfa', 'UI/UX Designer',         'offline'],
    ['Bobur Xasanov',     'bobur@taskflow.uz',   hash('emp123'),    'employee', 'BX', '#f97316', 'Mobile Developer',       'online'],
    ['Zilola Mirzayeva',  'zilola@taskflow.uz',  hash('emp123'),    'employee', 'ZM', '#06b6d4', 'HR Manager',             'online'],
    ['Kamol Nurmatov',    'kamol@taskflow.uz',   hash('emp123'),    'employee', 'KN', '#e11d48', 'DevOps Engineer',        'online'],
  ];

  for (const u of users) {
    await db.run('INSERT INTO users (name, email, password, role, initials, color, position, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ...u);
  }
  console.log(`✅ ${users.length} users created`);

  // ══════════════════════════════════════
  // PROJECTS
  // ══════════════════════════════════════
  const projects = [
    ['E-Commerce Platform',  'TechMart LLC',  2, 'progress', 'high',     68, '2026-01-15', '2026-04-30', 'Zamonaviy e-commerce platformasi. React frontend, Node.js backend, PostgreSQL.'],
    ['CRM Tizimi',           'InnoSoft',      3, 'progress', 'critical', 42, '2026-02-01', '2026-05-15', 'Ichki CRM tizimi — xodimlar, mijozlar, loyihalar boshqaruvi.'],
    ['Mobile Banking App',   'FinTech UZ',    2, 'progress', 'critical', 35, '2026-02-20', '2026-06-30', 'iOS va Android uchun mobil banking ilovasi.'],
    ['HR Portal',            'Ichki loyiha',  1, 'review',   'medium',   89, '2025-11-01', '2026-03-31', 'Xodimlar portali — attendance, kadrlar, hisob-kitob.'],
    ['Analytics Dashboard',  'DataViz Corp',  3, 'new',      'medium',    5, '2026-03-15', '2026-07-15', 'Real-time analytics dashboard. D3.js + WebSocket.'],
    ['API Gateway',          'Ichki infra',   1, 'approved', 'high',    100, '2025-09-01', '2026-01-30', 'Microservice API Gateway — Kong + custom plugins.'],
    ['Chatbot Integration',  'ServiceBot',    2, 'delayed',  'high',     55, '2025-12-01', '2026-03-15', 'AI chatbot integratsiyasi — NLP, Telegram, web widget.'],
    ['DevOps Pipeline',      'Ichki infra',   1, 'progress', 'low',      72, '2026-01-10', '2026-04-10', 'CI/CD pipeline — GitHub Actions, Docker, K8s.'],
  ];

  for (const p of projects) {
    await db.run('INSERT INTO projects (name, client, pm_id, status, priority, progress, start_date, deadline, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ...p);
  }
  console.log(`✅ ${projects.length} projects created`);

  // ── Project Members ──
  const members = [
    [1, 4], [1, 5], [1, 6], [1, 7],
    [2, 4], [2, 6], [2, 8], [2, 10],
    [3, 5], [3, 7], [3, 8],
    [4, 5], [4, 7],
    [5, 4], [5, 6],
    [6, 6], [6, 10],
    [7, 5], [7, 6],
    [8, 10],
  ];
  for (const m of members) {
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?) RETURNING project_id', ...m);
  }
  console.log(`✅ ${members.length} project members added`);

  // ── Project Files ──
  const files = [
    [1, 'TZ_ECommerce_v2.pdf',   '2.4 MB', 'Dilshod K.'],
    [1, 'Design_Specs.docx',     '890 KB', 'Gulnora U.'],
    [2, 'CRM_TZ_Final.pdf',      '3.1 MB', 'Madina R.'],
    [4, 'HR_Requirements.xlsx',   '560 KB', 'Zilola M.'],
  ];
  for (const f of files) {
    await db.run('INSERT INTO project_files (project_id, name, size, author) VALUES (?, ?, ?, ?)', ...f);
  }

  // ══════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════
  const tasks = [
    ['EC-001', 'Product listing sahifasi',      1, 5,  'approved', 'high',     '2026-03-20', "Mahsulotlar ro'yxati sahifasini yaratish — filter, sort, pagination.", null, 0, 3, 2],
    ['EC-002', 'Shopping cart moduli',           1, 5,  'progress', 'high',     '2026-04-05', "Savat funksiyasi — qo'shish, o'chirish, miqdor.", null, 0, 5, 1],
    ['EC-003', 'Payment gateway integratsiya',   1, 6,  'new',      'critical', '2026-04-15', 'Click va Payme integratsiyasi.', null, 0, 1, 0],
    ['EC-004', 'Admin panel dizayn',             1, 7,  'review',   'medium',   '2026-04-02', 'Admin panel uchun UI/UX dizayn.', null, 0, 8, 4],
    ['CRM-001','Xodimlar moduli',                2, 4,  'progress', 'high',     '2026-04-10', 'Xodimlar CRUD, filter, export.', null, 0, 3, 1],
    ['CRM-002','Dashboard statistika',           2, 6,  'delayed',  'critical', '2026-03-25', 'Real-time statistika dashboard.', 'Texnik muammo — WebSocket timeout masalasi', 8, 12, 2],
    ['CRM-003','Mijozlar bazasi',                2, 10, 'new',      'medium',   '2026-04-20', "Mijozlar ma'lumotlar bazasi va import.", null, 0, 0, 0],
    ['MB-001', 'Login / Auth ekran',             3, 8,  'approved', 'critical', '2026-03-15', 'Biometrik va PIN kod bilan kirish.', null, 0, 4, 2],
    ['MB-002', 'Tranzaksiya tarixi',             3, 5,  'progress', 'high',     '2026-04-08', "Barcha tranzaksiyalar ro'yxati va filterlash.", null, 0, 2, 0],
    ['MB-003', 'Push notification',              3, 8,  'new',      'medium',   '2026-04-25', 'Firebase push notification integratsiyasi.', null, 0, 0, 0],
    ['HR-001', 'Attendance modul',               4, 5,  'review',   'high',     '2026-03-28', 'Kunlik davomat qayd etish tizimi.', null, 0, 6, 3],
    ['HR-002', 'Ish haqi hisoblash',             4, 7,  'returned', 'critical', '2026-03-30', 'Oylik ish haqi avtomatik hisob.', null, 0, 9, 1],
    ['AD-001', 'Chart komponentlari',            5, 4,  'new',      'medium',   '2026-04-30', 'D3.js bilan chart komponentlarini yaratish.', null, 0, 1, 0],
    ['CB-001', 'NLP model integratsiya',         7, 6,  'delayed',  'critical', '2026-03-01', 'Chatbot uchun NLP model ulash.', 'Tashqi API javob bermayapti', 32, 7, 3],
    ['DO-001', 'Docker compose setup',           8, 10, 'approved', 'medium',   '2026-03-10', 'Barcha servicelar uchun docker compose.', null, 0, 2, 1],
    ['EC-005', 'Responsive dizayn',              1, 7,  'new',      'medium',   '2026-04-18', 'Barcha sahifalar uchun responsive layout.', null, 0, 0, 0],
    ['CRM-004','Hisobot generatsiya',            2, 4,  'progress', 'high',     '2026-04-12', "Turli formatdagi hisobotlar — PDF, Excel.", null, 0, 4, 2],
    ['CRM-005','Email notification',             2, 10, 'new',      'low',      '2026-05-01', 'Email alert tizimi — SMTP, template.', null, 0, 0, 0],
  ];

  for (const t of tasks) {
    await db.run('INSERT INTO tasks (code, title, project_id, assignee_id, status, priority, deadline, description, delay_reason, delay_days, comments_count, files_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ...t);
  }
  console.log(`✅ ${tasks.length} tasks created`);

  // ── Checklists ──
  const checklists = [
    [1, 'UI dizayn', 1], [1, 'API integrasiya', 1], [1, 'Testlar', 1],
    [2, 'Cart context', 1], [2, 'UI komponent', 0], [2, 'Checkout flow', 0],
    [3, 'API kalitlar', 0], [3, 'Backend handler', 0], [3, 'Test tranzaksiya', 0],
    [4, 'Wireframe', 1], [4, 'Hi-Fi dizayn', 1], [4, 'Prototype', 0],
    [5, 'Model', 1], [5, 'API', 1], [5, 'Frontend', 0],
    [6, 'Chart lib', 1], [6, 'WebSocket', 0], [6, 'Cache', 0],
    [7, 'DB schema', 0], [7, 'Import tool', 0],
    [8, 'UI', 1], [8, 'Biometrik', 1], [8, 'PIN flow', 1],
    [9, 'API', 1], [9, 'UI list', 0], [9, 'Filter', 0],
    [10, 'Firebase setup', 0], [10, 'Handler', 0],
    [11, 'Check-in/out', 1], [11, 'Hisobot', 1], [11, 'Admin view', 1],
    [12, 'Formulalar', 1], [12, 'PDF chiqarish', 0],
    [13, 'Bar chart', 0], [13, 'Line chart', 0], [13, 'Pie chart', 0],
    [14, 'API connect', 1], [14, 'Training data', 0], [14, 'Testing', 0],
    [15, 'Compose file', 1], [15, 'Test', 1],
    [16, 'Mobile', 0], [16, 'Tablet', 0],
    [17, 'PDF engine', 1], [17, 'Excel export', 0], [17, 'Template dizayn', 0],
    [18, 'SMTP setup', 0], [18, 'Templates', 0],
  ];
  for (const c of checklists) {
    await db.run('INSERT INTO checklists (task_id, text, done) VALUES (?, ?, ?)', ...c);
  }
  console.log(`✅ ${checklists.length} checklist items created`);

  // ══════════════════════════════════════
  // CHAT ROOMS + MESSAGES
  // ══════════════════════════════════════
  const rooms = [
    ['group',  'E-Commerce Team', '#3b82f6'],
    ['group',  'CRM Jamoa',       '#8b5cf6'],
    ['group',  'Umumiy kanal',    '#f59e0b'],
    ['direct', null,              null],
    ['direct', null,              null],
    ['direct', null,              null],
    ['direct', null,              null],
  ];
  for (const r of rooms) {
    await db.run('INSERT INTO chat_rooms (type, name, color) VALUES (?, ?, ?)', ...r);
  }

  const chatMembers = [
    [1, 2], [1, 4], [1, 5], [1, 6], [1, 7],
    [2, 3], [2, 4], [2, 6], [2, 8], [2, 10],
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10],
    [4, 1], [4, 4],
    [5, 1], [5, 5],
    [6, 1], [6, 7],
    [7, 1], [7, 2],
  ];
  for (const m of chatMembers) {
    await db.run('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?) RETURNING room_id', ...m);
  }

  const today = new Date().toISOString().split('T')[0];
  const msgs = [
    [1, 2, "Bugun sprint review bo'ladi, tayyor bo'linglar",  `${today} 09:30`],
    [1, 4, 'Frontend qismi 80% tayyor',                       `${today} 09:45`],
    [1, 5, 'API endpointlar hammasi ishlayapti',              `${today} 10:00`],
    [1, 7, 'Yangi dizayn variantini yubordim',                `${today} 11:20`],
    [1, 6, 'Backend deployment qildim, test qilinglar',       `${today} 13:15`],
    [1, 2, "Cart moduli tayyor bo'ldimi?",                    `${today} 14:25`],
    [4, 4, "Bu PR ni ko'rib chiqing",                         `${today} 14:00`],
    [4, 1, "OK, ko'raman",                                    `${today} 14:10`],
    [4, 4, 'PR merge qildim',                                 `${today} 14:30`],
  ];
  for (const m of msgs) {
    await db.run('INSERT INTO messages (room_id, user_id, text, created_at) VALUES (?, ?, ?, ?)', ...m);
  }
  console.log('✅ Chat rooms & messages created');

  // ══════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════
  const notifs = [
    [1, 'task',     '✅', 'Yangi task biriktildi',      '"Shopping cart moduli" sizga biriktildi',           0, 'var(--info-bg)'],
    [1, 'deadline', '⏰', 'Deadline yaqinlashmoqda',    '"Admin panel dizayn" — 2 kun qoldi',               0, 'var(--warning-bg)'],
    [1, 'review',   '🔍', 'Review qaytarildi',          '"Ish haqi hisoblash" — 3 ta izoh bilan qaytarildi',0, 'var(--error-bg)'],
    [1, 'approved', '✓',  'Task tasdiqlandi',           '"Product listing sahifasi" tasdiqlandi',            1, 'var(--success-bg)'],
    [1, 'chat',     '💬', 'Yangi xabar',                'Jasur: "PR merge qildim"',                         1, 'var(--info-bg)'],
    [1, 'deadline', '🔴', "Deadline o'tdi!",            '"NLP model integratsiya" — 32 kun kechikmoqda',    1, 'var(--error-bg)'],
    [1, 'feedback', '💡', 'Feedback javob',             'Adminga yuborilgan fikringizga javob keldi',        1, 'var(--accent-500)'],
  ];
  for (const n of notifs) {
    await db.run('INSERT INTO notifications (user_id, type, icon, title, description, read, color) VALUES (?, ?, ?, ?, ?, ?, ?)', ...n);
  }
  console.log('✅ Notifications created');

  // ══════════════════════════════════════
  // FEEDBACKS
  // ══════════════════════════════════════
  const feedbacks = [
    ['idea',       'Notifications tizimi',    "Push notification qo'shilsa yaxshi bo'lardi.", 4, 0, 'answered',   "Yaxshi fikr! Keyingi sprintga qo'shamiz.", 'Anvar A.', '2026-03-29'],
    ['suggestion', 'Code review jarayoni',    "Code review uchun avtomatik assign tizimi kerak.", 5, 0, 'pending', null, null, null],
    ['complaint',  'Server tez-tez tushadi',  'Staging server oxirgi 1 haftada 3 marta tushdi.', null, 1, 'in_review', null, null, null],
    ['idea',       'Dark mode',              "Tizimda dark mode opsiyasi bo'lsa juda yaxshi bo'lardi.", 7, 0, 'answered', 'Allaqachon ishlayapti! Settings dan yoqing.', 'Anvar A.', '2026-03-21'],
    ['suggestion', 'Sprint retrospective',   "Har sprint oxirida retrospective yig'ilish o'tkazish.", null, 1, 'pending', null, null, null],
    ['complaint',  'VPN sekin ishlaydi',      "Remote ishlaganda VPN juda sekin.", 6, 0, 'resolved', "IT jamoasi bilan hal qilindi.", 'Kamol N.', '2026-03-17'],
  ];
  for (const f of feedbacks) {
    await db.run('INSERT INTO feedbacks (type, subject, text, author_id, anonymous, status, response_text, response_author, response_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ...f);
  }
  console.log('✅ Feedbacks created');

  // ══════════════════════════════════════
  // ACTIVITY LOG
  // ══════════════════════════════════════
  const activities = [
    [5,  'taskni yakunladi',       '"Product listing sahifasi"'],
    [2,  'yangi task yaratdi',     '"Payment gateway integratsiya"'],
    [7,  'dizayn yukladi',         '"Admin panel — Hi-Fi v2"'],
    [4,  'PR merge qildi',         '"feat/cart-module #47"'],
    [6,  "statusni o'zgartirdi",   '"Dashboard statistika" → Kechikdi'],
    [3,  'review boshladi',        '"Ish haqi hisoblash"'],
    [8,  'taskni yakunladi',       '"Login / Auth ekran"'],
    [10, 'deployment qildi',       '"API Gateway v2.1"'],
    [1,  'loyihani tasdiqladi',    '"HR Portal"'],
    [9,  "xodim qo'shdi",         '"Ozoda Tursunova — Junior Dev"'],
  ];
  for (const a of activities) {
    await db.run('INSERT INTO activity_log (user_id, action, target) VALUES (?, ?, ?)', ...a);
  }
  console.log('✅ Activity log created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:    admin@taskflow.uz    / admin123');
  console.log('   PM:       dilshod@taskflow.uz  / pm123');
  console.log('   PM:       madina@taskflow.uz   / pm123');
  console.log('   Employee: jasur@taskflow.uz    / emp123');
  console.log('   (All employees use password: emp123)');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});

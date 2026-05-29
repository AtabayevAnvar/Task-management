# TaskFlow — Loyiha va vazifa boshqaruv tizimi

**TaskFlow** — IT kompaniyalar uchun ichki boshqaruv platformasi. Loyihalar, vazifalar (tasklar), xodimlar, chat, bildirishnomalar va fikr-mulohaza bitta interfeysda boshqariladi.

Interfeys asosan **o‘zbek tilida**. Qorong‘u va yorug‘ mavzu (dark / light) qo‘llab-quvvatlanadi.

---

## Imkoniyatlar

| Modul | Tavsif |
|--------|--------|
| **Dashboard** | Umumiy statistika va so‘nggi faoliyat |
| **Loyihalar** | Yaratish, jamoa, progress, fayllar |
| **Tasklar** | Statuslar, ustuvorlik, checklist, tasdiqlash |
| **Kalendar** | Task deadline’lari bo‘yicha oylik ko‘rinish |
| **Chat** | Guruh va shaxsiy xonalar |
| **Bildirishnomalar** | Tizim xabarlari |
| **Xodimlar** | Ro‘yxat va yangi xodim qo‘shish (admin) |
| **Fikr-mulohaza** | G‘oya, taklif, shikoyat |
| **Sozlamalar** | Mavzu va profil |

### Foydalanuvchi rollari

| Rol | Huquqlar (qisqacha) |
|-----|---------------------|
| `admin` | To‘liq boshqaruv, xodim qo‘shish, loyiha/task CRUD |
| `pm` | Loyiha va task yaratish/tahrirlash |
| `teamlead` | Task yaratish (loyiha yaratish — admin/pm) |
| `employee` | O‘z vazifalari va umumiy ko‘rinish |
| `hr` | Kuzatuvchi (xodimlar bo‘limi, feedback) |

---

## Texnologiyalar

| Qism | Stack |
|------|--------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| Ma’lumotlar bazasi | PostgreSQL |
| Autentifikatsiya | JWT + bcrypt |

Backend frontend fayllarini ham xizmat qiladi — bitta serverda UI va API ishlaydi.

---

## Talablar

- [Node.js](https://nodejs.org/) 18 yoki undan yuqori
- [PostgreSQL](https://www.postgresql.org/) 14+ (lokal yoki bulut, masalan Render)
- `git` (ixtiyoriy)

---

## O‘rnatish

### 1. Repozitoriyani yuklab olish

```bash
git clone <repo-url>
cd loyiha-12
```

### 2. Backend bog‘liqliklari

```bash
cd backend
npm install
```

### 3. Muhit o‘zgaruvchilari

`backend/.env.example` faylini nusxalab `.env` qiling:

```bash
cd backend
copy .env.example .env
```

Yoki qo‘lda `backend` papkasida `.env` yarating:

```env
DATABASE_URL=postgresql://foydalanuvchi:parol@localhost:5432/taskflow
JWT_SECRET=uzingizning_xavfsiz_kalitingiz
JWT_EXPIRES_IN=24h
PORT=3000

# Render yoki boshqa SSL talab qiladigan host uchun (kerak bo‘lsa):
# PGSSLMODE=require
# DB_SSL=true
```

| O‘zgaruvchi | Majburiy | Tavsif |
|-------------|----------|--------|
| `DATABASE_URL` | Ha | PostgreSQL ulanish satri |
| `JWT_SECRET` | Tavsiya etiladi | Token imzolash kaliti (productionda majburiy) |
| `JWT_EXPIRES_IN` | Yo‘q | Token muddati (standart: `24h`) |
| `PORT` | Yo‘q | Server porti (standart: `3000`) |

### 4. Ma’lumotlar bazasini tayyorlash

Birinchi ishga tushirishda jadvallar avtomatik yaratiladi va demo ma’lumotlar qo‘yiladi:

```bash
npm start
```

Bu buyruq avval `seed.js` ni, keyin `server.js` ni ishga tushiradi. Bazada allaqachon ma’lumot bo‘lsa, seed o‘tkazib yuboriladi.

Faqat seed qilish:

```bash
npm run seed
```

Faqat server (watch rejimi):

```bash
npm run dev
```

### 5. Brauzerda ochish

```
http://localhost:3000
```

---

## Demo hisoblar

Birinchi `seed` dan keyin quyidagi hisoblar mavjud (faqat **lokal/demo** uchun; productionda parollarni o‘zgartiring):

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | `admin@taskflow.uz` | `admin123` |
| PM | `dilshod@taskflow.uz` | `pm123` |
| PM | `madina@taskflow.uz` | `pm123` |
| Team Lead | `jasur@taskflow.uz` | `emp123` |
| HR | `zilola@taskflow.uz` | `emp123` |
| Xodim | `nodira@taskflow.uz` | `emp123` |

Boshqa xodimlar ham `*@taskflow.uz` va parol `emp123` bilan kirish mumkin (seed ro‘yxatiga qarang).

---

## API (qisqacha)

Barcha himoyalangan yo‘llar uchun sarlavha:

```
Authorization: Bearer <token>
```

| Prefix | Vazifa |
|--------|--------|
| `POST /api/auth/login` | Kirish |
| `GET /api/auth/me` | Joriy foydalanuvchi |
| `GET/POST /api/projects` | Loyihalar |
| `GET/POST /api/tasks` | Vazifalar |
| `GET /api/users` | Xodimlar |
| `GET/POST /api/chat/...` | Chat |
| `GET /api/notifications` | Bildirishnomalar |
| `GET/POST /api/feedback` | Fikr-mulohaza |
| `GET /api/dashboard/stats` | Dashboard statistikasi |
| `GET /api/health` | Server holati |

To‘liq mantiq `backend/routes/` papkasida.

---

## Loyiha tuzilmasi

```
├── index.html          # Asosiy sahifa
├── css/                # Uslublar
├── js/                 # Frontend modullar
│   ├── api.js          # REST klient
│   ├── app.js          # Navigatsiya va yordamchilar
│   └── layout/         # Sidebar, header, login
├── assets/             # Ikonkalar
└── backend/
    ├── server.js       # Express kirish nuqtasi
    ├── db/             # PostgreSQL + seed
    ├── routes/         # API marshrutlar
    └── middleware/     # JWT autentifikatsiya
```

---

## Ishlab chiqish eslatmalari

- Frontend ma’lumotlari login dan keyin API orqali `USERS`, `PROJECTS`, `TASKS` va boshqa global massivlarga yuklanadi.
- `npm start` har safar seed ni chaqiradi; mavjud bazada seed o‘tkaziladi.
- Production uchun `JWT_SECRET` ni kuchli qiymatga almashtiring va demo parollardan voz keching.

---

## Muammolarni bartaraf etish

| Muammo | Yechim |
|--------|--------|
| `DATABASE_URL is not defined` | `backend/.env` faylini tekshiring |
| `Server bilan aloqa yo'q` | `npm start` ishlayotganini va portni tekshiring |
| `Token yaroqsiz` | Qayta login qiling yoki `localStorage` ni tozalang |
| SSL xatosi (Render) | `.env` ga `PGSSLMODE=require` qo‘shing |

---

## Litsenziya

Loyiha o‘quv / portfolio maqsadida. Tijorat foydalanishdan oldin litsenziyani aniqlashtiring.

---

## Muallif

TaskFlow — loyiha va vazifa boshqaruvi uchun ichki tizim.

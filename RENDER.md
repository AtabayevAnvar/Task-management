# Render.com da deploy qilish

## Xato: `DATABASE_URL topilmadi`

Render `.env` faylni GitHubdan olmaydi. O'zgaruvchilar **Dashboard** orqali beriladi.

### Tezkor tuzatish (5 daqiqa)

1. [dashboard.render.com](https://dashboard.render.com) → **PostgreSQL** service bormi?
   - **Yo'q** → **New +** → **PostgreSQL** → yarating.
   - **Ha** → oching → **Connections** → **Internal Database URL** ni nusxalang.

2. **Web Service** `Task-management` → **Environment**:
   | Key | Qiymat |
   |-----|--------|
   | `DATABASE_URL` | PostgreSQL **Internal Database URL** |
   | `JWT_SECRET` | Uzun tasodifiy matn (32+ belgi) |

   Yoki: **Add Environment Variable** → **Add from database** → PostgreSQL ni tanlang.

3. **Save Changes** — avtomatik qayta deploy boshlanadi.

4. **Events** da **Live** (yashil) kuting.

5. Tekshiring: `https://task-management-n73r.onrender.com/api/health`

### Web service sozlamalari

| Maydon | Qiymat |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Server ishga tushganda **bo'sh bazaga avtomatik seed** qilinadi (`node server.js` yetarli).

`npm start` ham seed + server (ikki marta seed tekshiruvi — xavfsiz).

### Mavjud PostgreSQL nomi boshqa bo'lsa

`render.yaml` dagi `taskflow-db` ni o'z bazangiz nomiga moslashtiring yoki faqat Environment da `DATABASE_URL` qo'lda qo'shing.

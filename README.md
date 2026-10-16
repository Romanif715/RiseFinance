# RiseFinance — курсова робота 2026 

## Стек
- Frontend: HTML, CSS, JavaScript (ES-модулі)
- Backend: Supabase (PostgreSQL + REST API + Auth)
- Хостинг: GitHub Pages
- Графіки: Chart.js

## Функції
- Адаптивний лендинг з 4 секціями
- Форма консультації → збереження в `consultations`
- Підписка на новини → `subscribers` (з UNIQUE-перевіркою)
- Новини з БД → `news`
- Адмінпанель: Auth, CRUD заявок і новин, статистика

## Архітектура
- `index.html` — лендинг
- `admin/index.html` — адмінпанель
- `assets/js/supabase.js` — клієнт Supabase
- `assets/js/main.js` — логіка лендингу
- `assets/css/style.css` — стилі

## Безпека
- RLS-політики на всіх таблицях
- Anon key для публічних операцій
- Supabase Auth для адміна
- UNIQUE-обмеження на email підписників

## Aдміністратор + BD
Email: admin@risefinance.local
Password: admin1234567890

risefinance123@ - до БД

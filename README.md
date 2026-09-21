# ivangrigorenko.com

Портфолио Ивана Григоренко. Копия страницы `/home-ru` с оригинального сайта
(он собран в Figma Sites), перенесённая на редактируемый стек.

## Стек

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS 4 (CSS-first, без `tailwind.config`)
- Деплой на Vercel

## Деплой

Репозиторий подключён к Vercel-проекту `ivangrigorenko-site` (команда Tank-dsgn).
Push в `main` автоматически выкатывает прод на https://ivangrigorenko-site.vercel.app,
push в любую другую ветку создаёт preview-деплой.

Ручной деплой, если он зачем-то понадобится:

```bash
npx vercel@latest deploy --prod
```

## Запуск

Node лежит в `~/.local/node/bin` и не входит в PATH по умолчанию:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev
```

Открыть http://localhost:3000 — корень редиректит на `/home-ru`.

## Структура

```
app/
  layout.tsx        шрифт Open Sans, метаданные, og-картинка
  page.tsx          / → редирект на /home-ru
  home-ru/page.tsx  главная
  globals.css       токены цветов, теней и брейкпоинтов
components/
  Header.tsx        шапка; на узких экранах — бургер с оверлеем
  Hero.tsx          первый экран
  ProjectCard.tsx   карточка проекта
  Footer.tsx        контакты и соцсети
lib/projects.ts     контент: проекты, почта, соцсети
public/img/         картинки и иконки с оригинального сайта
```

## Как устроена вёрстка

Брейкпоинты повторяют оригинал — три фрейма из Figma:

| | ширина | префикс Tailwind |
|---|---|---|
| Mobile | < 800 | без префикса |
| Tablet | 800–1279 | `md:` |
| Desktop | ≥ 1280 | `xl:` |

Геометрия сверена с оригиналом по вычисленным стилям: высота страницы,
координаты карточек и футера совпадают на всех трёх брейкпоинтах.

Кадрирование картинок в карточках задано как `object-fit: cover` плюс
небольшой зум (`zoom` в `lib/projects.ts`) — так воспроизводится кроп,
который в оригинале приходит из Figma. Наведение увеличивает картинку
до 1.07 за 300ms, как в оригинале.

## Что ещё не перенесено

- Страницы кейсов: `/eazychange-ru`, `/autotor-ru`, `/pot-ru`, `/ostral-ru`,
  `/vv-ru`, `/mikulich-ru`. Ссылки на них уже стоят.
- Страница «Обо мне» `/about-ru`.
- Английская версия. Сейчас `/` редиректит на `/home-ru`.
- Меню на узких экранах в оригинале — отдельная страница `/home-menu-ru`;
  здесь сделан оверлей поверх страницы.

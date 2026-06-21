# hugo.dev — Blog técnico personal

Blog técnico personal construido con Astro. Documentación de proyectos, arquitectura de software y experimentos de ingeniería.

## Stack

- **Framework**: Astro 4 (SSG)
- **Estilos**: Tailwind CSS + @tailwindcss/typography
- **Contenido**: Markdown via Astro Content Collections
- **Búsqueda**: Pagefind (indexado en build time)
- **Hosting**: Firebase Hosting

## Inicio rápido

```bash
npm install
npm run dev
```

El sitio corre en `http://localhost:4321`.

## Comandos

| Comando          | Descripción                                     |
|------------------|-------------------------------------------------|
| `npm run dev`    | Servidor de desarrollo en localhost:4321        |
| `npm run build`  | Build de producción + indexado de búsqueda      |
| `npm run preview`| Preview del build de producción                 |
| `npm run lint`   | Ejecuta ESLint                                  |
| `npm run format` | Formatea con Prettier                           |
| `npm run deploy` | Build + deploy a Firebase Hosting               |

## Escribir un artículo

Crea un archivo `.md` en `src/content/posts/`:

```markdown
---
title: "Título del artículo"
description: "Descripción breve para SEO y cards."
publishedAt: 2024-01-15
updatedAt: 2024-01-20       # opcional
tags: ["typescript", "architecture"]
draft: false
coverImage: "/images/mi-imagen.jpg"  # opcional
projectStatus: "completed"           # idea | wip | completed | archived
---

Contenido del artículo en Markdown...
```

El slug de la URL se infiere del nombre del archivo: `mi-articulo.md` → `/blog/mi-articulo`.

### Campos del frontmatter

| Campo           | Tipo                                      | Requerido |
|-----------------|-------------------------------------------|-----------|
| `title`         | `string`                                  | Sí        |
| `description`   | `string`                                  | Sí        |
| `publishedAt`   | `Date` (YYYY-MM-DD)                       | Sí        |
| `updatedAt`     | `Date` (YYYY-MM-DD)                       | No        |
| `tags`          | `string[]` (mínimo 1)                     | Sí        |
| `draft`         | `boolean` (default: `false`)              | No        |
| `coverImage`    | `string` (URL relativa)                   | No        |
| `projectStatus` | `idea \| wip \| completed \| archived`    | No        |

Los artículos con `draft: true` no se publican en el build.

## Búsqueda

Pagefind indexa el contenido en tiempo de build. Para usar la búsqueda en desarrollo:

```bash
npm run build        # genera el índice en dist/pagefind/
cp -r dist/pagefind public/pagefind  # copia al directorio público
npm run dev          # ahora la búsqueda funciona en dev
```

## Deployment en Firebase Hosting

### Primera vez

```bash
# 1. Instala Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Configura el proyecto (edita .firebaserc con tu project ID)
firebase use --add

# 4. Deploy
npm run deploy
```

### Deploys siguientes

```bash
npm run deploy
```

### Configurar dominio personalizado

En Firebase Console → Hosting → Add custom domain.

## Estructura del proyecto

```
src/
├── components/
│   ├── blog/          # ArticleCard, ArticleHeader, ArticleNav, TableOfContents
│   ├── seo/           # SEO, JsonLd
│   └── ui/            # Header, Footer, ThemeToggle, TagBadge
├── layouts/
│   ├── BaseLayout.astro
│   └── ArticleLayout.astro
├── pages/
│   ├── index.astro
│   ├── blog/[slug].astro
│   ├── tags/[tag].astro
│   ├── projects.astro
│   ├── about.astro
│   ├── search.astro
│   ├── robots.txt.ts
│   └── rss.xml.ts
├── content/
│   ├── config.ts      # Schema tipado de Content Collections
│   └── posts/         # Archivos .md
├── styles/global.css
└── utils/
    ├── posts.ts        # getSortedPosts, getAllTags, getPostsByTag
    ├── reading-time.ts
    └── seo.ts          # formatDate, slugifyTag
```

## Configuración del sitio

Edita `astro.config.mjs` para cambiar la URL del sitio:

```js
export default defineConfig({
  site: 'https://tu-dominio.web.app',  // o tu dominio personalizado
  // ...
});
```

## SEO incluido

- Meta tags (title, description, canonical)
- Open Graph + Twitter Cards
- Sitemap automático (`/sitemap-index.xml`)
- Robots.txt dinámico
- JSON-LD (Article schema por post, WebSite en home)
- RSS feed (`/rss.xml`)

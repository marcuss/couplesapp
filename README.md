# CouplesApp

## Configuración de Supabase (Entornos)

### Proyectos Supabase

La app usa 2 proyectos Supabase separados gestionados via Terraform en [nextasyapps-infra](https://github.com/marcuss/nextasyapps-infra):

| Entorno | Proyecto | Branch |
|---------|----------|--------|
| Dev | `couplesapp-dev` | develop/feature branches |
| Prod | `couplesapp-prod` | main |

### Cómo obtener las keys de cada ambiente

#### Opción 1: Desde el dashboard de Supabase

1. Ir a https://supabase.com/dashboard
2. Seleccionar el proyecto (`couplesapp-dev` o `couplesapp-prod`)
3. Ir a **Settings → API**
4. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API Keys → anon public** → `VITE_SUPABASE_ANON_KEY`

#### Opción 2: Desde Terraform outputs

```bash
cd terraform/environments/dev
terraform output dev_api_url      # para .env (dev)
terraform output dev_anon_key     # para .env (dev)
terraform output prod_api_url     # para .env.production
terraform output prod_anon_key    # para .env.production
```

#### Opción 3: Desde Supabase CLI

```bash
# Instalar CLI: https://supabase.com/docs/guides/cli
supabase projects list
supabase projects api-keys --project-ref <PROJECT_REF>
```

### Variables de entorno requeridas

Crear `.env` (desarrollo) y `.env.production` (producción):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_URL=http://localhost:5173  # o URL de producción
```

> ⚠️ **Nunca** subir archivos `.env` con valores reales al repositorio.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# @wemt/vue3-auto-router

[简体中文](./README.md) | **English**

An automatic route generation plugin designed specifically for Vue 3 + Vite projects, which can automatically generate Vue Router configuration based on file system structure.

## ✨ Features

- 🚀 **Smart Route Generation**: Automatically generate Vue Router configuration based on file system structure, say goodbye to manual route maintenance
- 👁️ **Real-time File Watching**: Intelligently watch file changes in development mode and automatically regenerate route configuration
- ⚙️ **Highly Customizable**: Provides rich configuration options to fully meet the personalized needs of different projects
- 🛡️ **Route Guard Integration**: Automatically generate basic route guards, support permission control and page title setting
- 📝 **Meta Information Support**: Support using `defineOptions` in Vue components to define route meta information
- ⚡ **Performance Optimization**: Enable component lazy loading by default, significantly improve application loading performance
- 🪶 **Lightweight Design**: Minimal dependencies, extremely small package size, does not affect project build speed
- 🔧 **TypeScript Support**: Complete TypeScript type definitions, providing a good development experience

## 📦 Installation

```bash
npm install @wemt/vue3-auto-router
# or
yarn add @wemt/vue3-auto-router
# or
pnpm add @wemt/vue3-auto-router
```

## 🚀 Quick Start

### 1. Configure Vite Plugin

Configure the plugin in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueAutoRouter } from "@wemt/vue3-auto-router";

export default defineConfig({
  plugins: [
    vue(),
    vueAutoRouter({
      // Optional configuration
      scanDir: "src/views",
      defaultTitle: "My App",
    }),
  ],
});
```

### 2. Configure Router

Configure auto routes in `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from "vue-router";
import autoRoutes from "./auto/routes"; // Auto-generated route configuration
import { setupRouteGuards } from "./guards"; // Auto-generated route guards

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Your custom routes
    {
      path: "/custom",
      name: "custom",
      component: () => import("@/views/Custom.vue"),
    },
    // Auto-generated routes
    ...autoRoutes,
  ],
});

// Setup route guards
setupRouteGuards(router);

export default router;
```

### 3. Create Page Files

Create your page files in the `src/views` directory:

```
src/views/
├── index.vue         # Route: / (home page)
├── Home.vue          # Route: /home
├── About.vue         # Route: /about
├── user/
│   ├── index.vue     # Route: /user (user home page)
│   ├── Profile.vue   # Route: /user/profile
│   └── Settings.vue  # Route: /user/settings
├── dashboard/
│   └── home.vue      # Route: /dashboard (if 'home' in config)
└── 404.vue          # 404 page
```

### 4. Define Route Meta Information in Vue Components

```vue
<template>
  <div class="user-profile">
    <h1>User Profile</h1>
    <!-- Page content -->
  </div>
</template>

<script setup lang="ts">
// Define route meta information
defineOptions({
  meta: {
    title: "User Profile",
    params: {
      requiresAuth: true,
      keepAlive: true,
    },
  },
});

// Component logic
const userInfo = ref({});
</script>
```

## 📁 Recommended Project Structure

```
src/
├── views/                    # Page components directory
│   ├── index.vue             # Root home page
│   ├── Home.vue             # Home page
│   ├── About.vue            # About page
│   ├── user/                # User-related pages
│   │   ├── index.vue        # User home page (/user)
│   │   ├── Profile.vue      # User profile
│   │   └── Settings.vue     # User settings
│   └── 404.vue             # 404 page
├── router/                  # Router configuration directory
│   ├── index.ts            # Main router file
│   ├── guards.ts           # Route guards (auto-generated)
│   └── auto/               # Auto-generated route files
│       ├── routes.ts       # Route configuration
│       └── config.ts       # Configuration information
└── components/             # Common components (not scanned as routes)
```

## ⚙️ Detailed Configuration

### Basic Configuration

```typescript
vueAutoRouter({
  // Scan directory, default is "src/views"
  scanDir: "src/views",

  // Supported file extensions, default is [".vue"]
  extensions: [".vue", ".ts", ".js"],

  // Excluded file patterns
  exclude: ["**/components/**", "**/__tests__/**", "**/.*"],

  // Route path prefix
  pathPrefix: "",

  // Whether to enable lazy loading, default is true
  lazy: true,

  // Default page title
  defaultTitle: "My App",

  // Global route meta information
  meta: {
    params: {
      requiresAuth: false,
      keepAlive: false,
    },
  },
});
```

### Naming Rules Configuration

```typescript
vueAutoRouter({
  naming: {
    // Whether to use kebab-case naming, default is false
    kebabCase: true,

    // Whether to preserve file path as route name, default is false
    preservePath: false,

    // Filename suffixes, will be removed when generating route names
    filenameSuffixes: ["View", "Page"],
  },
});
```

### Home Route Configuration

```typescript
vueAutoRouter({
  homeRoute: {
    path: "/", // Home path, default is "/"
    name: "home", // Home name, default is "home"
    files: ["index", "home", "main"] // Home page file names array (strict matching, case-sensitive)
  },
});
```

**Description**:
- File names in the `files` array do not need to include extensions
- **Strict configuration matching**: Only file names in the configuration array will be recognized as home page files
- **Case-sensitive**: `index` and `Index` are different and must strictly match the file names in the configuration
- **Subdirectory home page support**:
  - `src/views/index.vue` → Route path: `/`
  - `src/views/user/index.vue` → Route path: `/user`
  - `src/views/dashboard/home.vue` → Route path: `/dashboard` (if `home` is in configuration)
- **Route naming rules**:
  - Root directory home page: Uses configured `name` (default: `home`)
  - Subdirectory home page: `{directory-name}-{home-name}` (e.g., `user-home`, `dashboard-home`)

### 404 Page Configuration

```typescript
vueAutoRouter({
  notFound: {
    enabled: true, // Whether to enable 404 page, default is true
    path: "/:pathMatch(.*)*", // 404 page path
    name: "not-found", // 404 page name
    component: "src/views/404.vue", // 404 page component path
  },
});
```

### Output File Configuration

```typescript
vueAutoRouter({
  output: {
    routes: "src/router/auto/routes.ts", // Route file output path
    config: "src/router/auto/config.ts", // Config file output path
    guards: "src/router/guards.ts", // Guards file output path
  },
});
```

## 🛡️ Route Guards

The plugin will automatically generate basic route guard files, which you can customize based on:

```typescript
import type { Router } from "vue-router";

// Mock login status check function
function isAuthenticated(): boolean {
  return localStorage.getItem("token") !== null;
}

export function setupRouteGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    // Set page title
    const title = to.meta?.title as string;
    if (title) {
      document.title = title;
    }

    // Check if login is required
    if (to.meta?.params?.requiresAuth) {
      if (!isAuthenticated()) {
        next("/login");
        return;
      }
    }

    // Check permissions
    if (to.meta?.params?.permissions) {
      const userPermissions = getUserPermissions();
      const requiredPermissions = to.meta.params.permissions as string[];

      if (!hasPermissions(userPermissions, requiredPermissions)) {
        next("/403");
        return;
      }
    }

    next();
  });

  router.afterEach((to, from) => {
    // Handle after route change
    console.log(`Route changed from ${from.path} to ${to.path}`);

    // Page analytics, tracking, etc.
    if (to.meta?.title) {
      console.log(`Page title set to: ${to.meta.title}`);
    }
  });
}
```

## 🔧 Advanced Usage

### Dynamic Routes
Under development

### Transition Animations
Under development

### Route Caching
Under development

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

## 👨‍💻 Author

**Mutaoinc & Wemt Team**

---

If this tool is helpful to you, please give it a ⭐ Star for support!
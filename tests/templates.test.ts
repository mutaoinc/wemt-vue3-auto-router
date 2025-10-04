import { describe, it, expect } from 'vitest'
import { generateRoutesTemplate, generateConfigTemplate, generateGuardsTemplate } from '../src/templates'
import type { InternalAutoRouterOptions } from '../src/types'
import type { RouteRecordRaw } from 'vue-router'

describe('Templates', () => {
  const mockOptions: InternalAutoRouterOptions = {
    scanDir: 'src/views',
    extensions: ['.vue'],
    exclude: ['**/components/**'],
    pathPrefix: '',
    lazy: true,
    meta: { requiresAuth: false },
    naming: {
      kebabCase: false,
      preservePath: false,
      filenameSuffixes: []
    },
    homeRoute: {
      path: '/',
      name: 'home',
      files: ['index', 'home']
    },
    defaultTitle: 'Test App',
    notFound: {
      enabled: true,
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: 'src/views/404.vue'
    },
    output: {
      routes: 'src/router/auto/routes.ts',
      config: 'src/router/auto/config.ts',
      guards: 'src/router/guards.ts'
    }
  }

  describe('generateRoutesTemplate', () => {
    it('should generate valid TypeScript route configuration', () => {
      const routes: RouteRecordRaw[] = [
        {
          path: '/',
          name: 'home',
          component: () => import('../views/Home.vue'),
          meta: { title: 'Home' }
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('../views/About.vue'),
          meta: { title: 'About' }
        }
      ]

      const result = generateRoutesTemplate(routes)

      // Should contain TypeScript imports
      expect(result).toContain("import type { RouteRecordRaw } from 'vue-router'")
      
      // Should contain auto-generated comment
      expect(result).toContain('Auto-generated route configuration')
      
      // Should contain route export
      expect(result).toContain('export const autoRoutes: RouteRecordRaw[]')
      expect(result).toContain('export default autoRoutes')
      
      // Should contain HMR support
      expect(result).toContain('import.meta.hot')
      
      // Should contain route paths
      expect(result).toContain("path: '/'")
      expect(result).toContain("path: '/about'")
      
      // Should contain route names
      expect(result).toContain("name: 'home'")
      expect(result).toContain("name: 'about'")
      
      // Should contain meta information
      expect(result).toContain("title: 'Home'")
      expect(result).toContain("title: 'About'")
    })

    it('should handle empty routes array', () => {
      const routes: RouteRecordRaw[] = []
      const result = generateRoutesTemplate(routes)

      expect(result).toContain('export const autoRoutes: RouteRecordRaw[] = [')
      expect(result).toContain(']')
      expect(result).toContain('export default autoRoutes')
    })

    it('should handle routes with complex meta objects', () => {
      const routes: RouteRecordRaw[] = [
        {
          path: '/admin',
          name: 'admin',
          component: () => import('../views/Admin.vue'),
          meta: {
            title: 'Admin Panel',
            requiresAuth: true,
            permissions: ['admin'],
            params: {
              layout: 'admin',
              keepAlive: true
            }
          }
        }
      ]

      const result = generateRoutesTemplate(routes)

      expect(result).toContain("title: 'Admin Panel'")
      expect(result).toContain('requiresAuth: true')
      expect(result).toContain('permissions:')
      expect(result).toContain('params:')
    })
  })

  describe('generateConfigTemplate', () => {
    it('should generate valid configuration object', () => {
      const result = generateConfigTemplate(mockOptions)

      // Should contain config export
      expect(result).toContain('export const routeConfig =')
      expect(result).toContain('export default routeConfig')
      
      // Should contain auto-generated comment
      expect(result).toContain('自动生成的路由配置文件')
      
      // Should contain configuration values
      expect(result).toContain(mockOptions.scanDir)
      expect(result).toContain(mockOptions.defaultTitle)
      
      // Should contain configuration sections
      expect(result).toContain('"base":')
      expect(result).toContain('"meta":')
      expect(result).toContain('"autoRoute":')
      expect(result).toContain('"notFound":')
    })

    it('should include all configuration sections', () => {
      const result = generateConfigTemplate(mockOptions)

      expect(result).toContain('"base":')
      expect(result).toContain('"meta":')
      expect(result).toContain('"autoRoute":')
      expect(result).toContain('"notFound":')
    })
  })

  describe('generateGuardsTemplate', () => {
    it('should generate valid route guards file', () => {
      const result = generateGuardsTemplate(mockOptions)

      // Should contain TypeScript imports
      expect(result).toContain("import type { Router } from 'vue-router'")
      
      // Should contain setup function
      expect(result).toContain('export function setupRouteGuards(router: Router)')
      
      // Should contain guards config export
      expect(result).toContain('export { guardsConfig }')
      
      // Should contain route hooks
      expect(result).toContain('router.beforeEach')
      expect(result).toContain('router.afterEach')
      
      // Should contain title setting logic
      expect(result).toContain('document.title')
      
      // Should contain default title
      expect(result).toContain(mockOptions.defaultTitle)
      
      // Should contain protection notice
      expect(result).toContain('注意：此文件仅在首次生成时创建')
      expect(result).toContain('之后不会被覆盖')
    })

    it('should include example guard logic in comments', () => {
      const result = generateGuardsTemplate(mockOptions)

      // Should contain authentication example
      expect(result).toContain('检查登录状态')
      expect(result).toContain('to.meta?.requiresAuth')
      
      // Should contain permission example
      expect(result).toContain('检查权限')
      expect(result).toContain('to.meta?.permissions')
      
      // Should contain custom params example
      expect(result).toContain('检查自定义参数')
      expect(result).toContain('to.meta?.params')
      
      // Should contain utility function examples
      expect(result).toContain('function checkAuthStatus')
      expect(result).toContain('function checkPermissions')
      expect(result).toContain('function trackPageView')
    })

    it('should handle empty default title', () => {
      const optionsWithoutTitle = { ...mockOptions, defaultTitle: '' }
      const result = generateGuardsTemplate(optionsWithoutTitle)

      expect(result).toContain('defaultTitle: ""')
      expect(result).not.toContain('defaultTitle: "undefined"')
    })
  })

  describe('Template code quality', () => {
    it('should generate syntactically valid TypeScript', () => {
      const routes: RouteRecordRaw[] = [
        {
          path: '/',
          name: 'home',
          component: () => import('../views/Home.vue'),
          meta: { title: 'Home' }
        }
      ]

      const routesCode = generateRoutesTemplate(routes)
      const configCode = generateConfigTemplate(mockOptions)
      const guardsCode = generateGuardsTemplate(mockOptions)

      // Basic syntax checks
      expect(routesCode).not.toContain('undefined')
      expect(configCode).not.toContain('undefined')
      expect(guardsCode).not.toContain('undefined')

      // Should not have trailing commas in wrong places
      expect(routesCode).not.toMatch(/,\s*\]/g)
      expect(routesCode).not.toMatch(/,\s*\}/g)
    })

    it('should escape strings properly', () => {
      const routes: RouteRecordRaw[] = [
        {
          path: "/test's-path",
          name: 'test-name',
          component: () => import('../views/Test.vue'),
          meta: { title: "Test's Title" }
        }
      ]

      const result = generateRoutesTemplate(routes)
      
      // Should handle quotes in strings
      expect(result).toContain("path: '/test\'s-path'")
      expect(result).toContain("title: 'Test\'s Title'")
    })
  })
})
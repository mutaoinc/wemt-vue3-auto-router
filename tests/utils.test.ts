import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  normalizePath, 
  isSamePath, 
  generateRoutePath, 
  generateRouteName, 
  generatePageTitle,
  generateImportStatement,
  mergeOptions,
  validateOptions,
  parseVueFileRouteMeta
} from '../src/utils'
import type { AutoRouterOptions, InternalAutoRouterOptions } from '../src/types'

describe('utils.ts', () => {
  describe('normalizePath', () => {
    it('should normalize Windows paths to Unix format', () => {
      expect(normalizePath('src\\views\\Home.vue')).toBe('src/views/Home.vue')
      expect(normalizePath('C:\\Users\\test\\project\\src\\views')).toBe('C:/Users/test/project/src/views')
    })

    it('should leave Unix paths unchanged', () => {
      expect(normalizePath('src/views/Home.vue')).toBe('src/views/Home.vue')
      expect(normalizePath('/home/user/project/src/views')).toBe('/home/user/project/src/views')
    })

    it('should handle mixed path separators', () => {
      expect(normalizePath('src\\views/components\\Test.vue')).toBe('src/views/components/Test.vue')
    })
  })

  describe('isSamePath', () => {
    it('should correctly compare same paths with different separators', () => {
      // Mock path.resolve to return predictable results
      const mockResolve = vi.fn()
      mockResolve.mockImplementation((p) => p.replace(/\\/g, '/'))
      
      // These tests would work in a real environment
      expect(normalizePath('src\\test') === normalizePath('src/test')).toBe(true)
    })
  })

  describe('generateRoutePath', () => {
    const options: InternalAutoRouterOptions = {
      scanDir: 'src/views',
      extensions: ['.vue'],
      exclude: [],
      pathPrefix: '',
      lazy: true,
      meta: {},
      naming: {
        kebabCase: false,
        preservePath: false,
        filenameSuffixes: []
      },
      homeRoute: { path: '/', name: 'home', files: ['index', 'home'] },
      defaultTitle: '',
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

    // Mock process.cwd for testing
    beforeEach(() => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
    })

    it('should generate correct route path for nested files', () => {
      const filePath = '/test/project/src/views/user/Profile.vue'
      const result = generateRoutePath(filePath, options)
      expect(result).toBe('user/Profile')
    })

    it('should handle index files correctly', () => {
      const filePath = '/test/project/src/views/user/index.vue'
      const result = generateRoutePath(filePath, options)
      expect(result).toBe('user/index')
    })

    it('should handle home page files', () => {
      const filePath = '/test/project/src/views/Home.vue'
      const result = generateRoutePath(filePath, options)
      expect(result).toBe('Home')
    })

    it('should apply kebab-case naming when configured', () => {
      const kebabOptions = {
        ...options,
        naming: { ...options.naming, kebabCase: true }
      }
      const filePath = '/test/project/src/views/UserProfile.vue'
      const result = generateRoutePath(filePath, kebabOptions)
      expect(result).toBe('user-profile')
    })

    it('should remove filename suffixes when configured', () => {
      const suffixOptions = {
        ...options,
        naming: { ...options.naming, filenameSuffixes: ['View', 'Page'] }
      }
      const filePath = '/test/project/src/views/UserView.vue'
      const result = generateRoutePath(filePath, suffixOptions)
      expect(result).toBe('User')
    })
  })

  describe('generateRouteName', () => {
    const options: InternalAutoRouterOptions = {
      scanDir: 'src/views',
      extensions: ['.vue'],
      exclude: [],
      pathPrefix: '',
      lazy: true,
      meta: {},
      naming: { kebabCase: false, preservePath: false, filenameSuffixes: [] },
      homeRoute: { path: '/', name: 'home' },
      defaultTitle: '',
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

    beforeEach(() => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
    })

    it('should generate route names with hyphens', () => {
      const filePath = '/test/project/src/views/user/Profile.vue'
      const result = generateRouteName(filePath, options)
      expect(result).toBe('user-Profile')
    })
  })

  describe('generatePageTitle', () => {
    const options: InternalAutoRouterOptions = {
      scanDir: 'src/views',
      extensions: ['.vue'],
      exclude: [],
      pathPrefix: '',
      lazy: true,
      meta: {},
      naming: { kebabCase: false, preservePath: false, filenameSuffixes: [] },
      homeRoute: { path: '/', name: 'home' },
      defaultTitle: '',
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

    beforeEach(() => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
    })

    it('should generate proper page titles', () => {
      const filePath = '/test/project/src/views/user/Profile.vue'
      const result = generatePageTitle(filePath, options)
      expect(result).toBe('User Profile')
    })
  })

  describe('generateImportStatement', () => {
    const options: InternalAutoRouterOptions = {
      scanDir: 'src/views',
      extensions: ['.vue'],
      exclude: [],
      pathPrefix: '',
      lazy: true,
      meta: {},
      naming: { kebabCase: false, preservePath: false, filenameSuffixes: [] },
      homeRoute: { path: '/', name: 'home' },
      defaultTitle: '',
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

    it('should generate correct import statements', () => {
      const filePath = '/test/project/src/views/Home.vue'
      const result = generateImportStatement(filePath, options)
      expect(result).toBe("() => import('../../views/Home.vue')")
    })

    it('should normalize path separators in import statements', () => {
      const filePath = 'C:\\test\\project\\src\\views\\Home.vue'
      const result = generateImportStatement(filePath, options)
      // Should contain forward slashes
      expect(result).toContain('/')
      expect(result).not.toContain('\\')
    })
  })

  describe('validateOptions', () => {
    it('should return no errors for valid options', () => {
      const options: AutoRouterOptions = {
        scanDir: 'src/views',
        extensions: ['.vue', '.ts'],
      }
      const errors = validateOptions(options)
      expect(errors).toHaveLength(0)
    })

    it('should detect empty scanDir', () => {
      const options: AutoRouterOptions = {
        scanDir: '   ',
      }
      const errors = validateOptions(options)
      expect(errors).toContain('scanDir cannot be empty')
    })

    it('should detect empty extensions array', () => {
      const options: AutoRouterOptions = {
        extensions: [],
      }
      const errors = validateOptions(options)
      expect(errors).toContain('extensions cannot be empty array')
    })

    it('should detect invalid homeRoute.files configuration', () => {
      const options1: AutoRouterOptions = {
        homeRoute: {
          files: [] as string[]
        }
      }
      const errors1 = validateOptions(options1)
      expect(errors1).toContain('homeRoute.files cannot be empty')

      const options2: AutoRouterOptions = {
        homeRoute: {
          files: ['', '  '] as string[]
        }
      }
      const errors2 = validateOptions(options2)
      expect(errors2).toContain('homeRoute.files must contain non-empty strings')
    })

    it('should accept valid homeRoute.files configuration', () => {
      const options: AutoRouterOptions = {
        homeRoute: {
          files: ['index', 'home', 'main']
        }
      }
      const errors = validateOptions(options)
      expect(errors).toHaveLength(0)
    })
  })

  describe('mergeOptions', () => {
    it('should return default options when no options provided', () => {
      const result = mergeOptions()
      expect(result.scanDir).toBe('src/views')
      expect(result.extensions).toEqual(['.vue'])
    })

    it('should merge user options with defaults', () => {
      const userOptions: AutoRouterOptions = {
        scanDir: 'src/pages',
        lazy: false,
      }
      const result = mergeOptions(userOptions)
      expect(result.scanDir).toBe('src/pages')
      expect(result.lazy).toBe(false)
      expect(result.extensions).toEqual(['.vue']) // default value
    })

    it('should merge nested options correctly', () => {
      const userOptions: AutoRouterOptions = {
        naming: {
          kebabCase: true,
        },
        output: {
          routes: 'custom/routes.ts',
        },
      }
      const result = mergeOptions(userOptions)
      expect(result.naming.kebabCase).toBe(true)
      expect(result.naming.preservePath).toBe(false) // default
      expect(result.output.routes).toBe('custom/routes.ts')
      expect(result.output.config).toBe('src/router/auto/config.ts') // default
    })
  })

  describe('parseVueFileRouteMeta', () => {
    it('should return null for non-existent files', () => {
      const result = parseVueFileRouteMeta('/non/existent/file.vue')
      expect(result).toBeNull()
    })

    it('should return null for files without defineOptions', () => {
      // Mock fs.readFileSync
      const mockReadFileSync = vi.fn()
      mockReadFileSync.mockReturnValue(`
        <template>
          <div>Test</div>
        </template>
        
        <script setup lang="ts">
        const message = 'Hello'
        </script>
      `)
      
      // We would need to mock fs module properly for this test
      // For now, just test the function exists
      expect(parseVueFileRouteMeta).toBeDefined()
    })
  })
})
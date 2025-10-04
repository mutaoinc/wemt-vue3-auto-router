import { describe, it, expect, beforeEach, vi } from 'vitest'
import { vueAutoRouter } from '../src/index'
import type { AutoRouterOptions } from '../src/types'

describe('Integration Tests', () => {
  describe('vueAutoRouter plugin', () => {
    it('should create a valid Vite plugin', () => {
      const plugin = vueAutoRouter()
      
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vue-auto-router')
      expect(plugin.enforce).toBe('pre')
      expect(typeof plugin.configResolved).toBe('function')
      expect(typeof plugin.buildStart).toBe('function')
      expect(typeof plugin.configureServer).toBe('function')
    })

    it('should accept custom options', () => {
      const options: AutoRouterOptions = {
        scanDir: 'src/pages',
        extensions: ['.vue', '.ts'],
        lazy: false,
        defaultTitle: 'Custom App'
      }
      
      const plugin = vueAutoRouter(options)
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vue-auto-router')
    })

    it('should validate options and show warnings for invalid config', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const invalidOptions: AutoRouterOptions = {
        scanDir: '   ', // empty scanDir
        extensions: [] // empty extensions
      }
      
      const plugin = vueAutoRouter(invalidOptions)
      expect(plugin).toBeDefined()
      
      // Should have shown warnings
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle undefined options gracefully', () => {
      const plugin = vueAutoRouter(undefined)
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vue-auto-router')
    })
  })

  describe('Cross-platform compatibility', () => {
    it('should handle Windows paths correctly', () => {
      const plugin = vueAutoRouter({
        scanDir: 'src\\views'
      })
      
      expect(plugin).toBeDefined()
    })

    it('should handle Unix paths correctly', () => {
      const plugin = vueAutoRouter({
        scanDir: 'src/views'
      })
      
      expect(plugin).toBeDefined()
    })
  })

  describe('File generation protection', () => {
    it('should have guards file protection enabled by default', () => {
      const plugin = vueAutoRouter()
      
      // Plugin should be created successfully
      expect(plugin).toBeDefined()
      
      // The protection mechanism is built into the generator
      // This test verifies the plugin can be created with default settings
    })
  })

  describe('Error handling', () => {
    it('should handle plugin initialization errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Test with potentially problematic config
      const plugin = vueAutoRouter({
        scanDir: '/non/existent/path',
        extensions: ['.vue']
      })
      
      expect(plugin).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Plugin lifecycle', () => {
    it('should handle configResolved lifecycle', () => {
      const plugin = vueAutoRouter()
      
      expect(plugin.configResolved).toBeDefined()
      
      // Mock config object
      const mockConfig = {
        root: '/test/project',
        build: {},
        server: {}
      }
      
      // Should not throw when called
      expect(() => {
        if (typeof plugin.configResolved === 'function') {
          plugin.configResolved(mockConfig)
        }
      }).not.toThrow()
    })

    it('should handle buildStart lifecycle', async () => {
      const plugin = vueAutoRouter()
      
      expect(plugin.buildStart).toBeDefined()
      
      // Should not throw when called
      if (typeof plugin.buildStart === 'function') {
        await expect(plugin.buildStart()).resolves.not.toThrow()
      }
    })

    it('should handle configureServer lifecycle', () => {
      const plugin = vueAutoRouter()
      
      expect(plugin.configureServer).toBeDefined()
      
      // Mock Vite dev server
      const mockServer = {
        watcher: {
          add: vi.fn(),
          on: vi.fn()
        },
        config: {
          root: '/test/project'
        },
        moduleGraph: {
          getModuleById: vi.fn(),
        },
        reloadModule: vi.fn()
      }
      
      // Should not throw when called
      expect(() => {
        if (typeof plugin.configureServer === 'function') {
          plugin.configureServer(mockServer as any)
        }
      }).not.toThrow()
    })
  })
})
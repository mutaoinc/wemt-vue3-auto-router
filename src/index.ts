import type { Plugin, ViteDevServer } from "vite";
import type { AutoRouterOptions } from "./types";
import { mergeOptions, PLUGIN_NAME, SUPPORTED_EXTENSIONS, validateOptions } from "./utils";
import { RouteGenerator } from "./generator";
import path from "path";
import fs from "fs";

// Vite插件主函数
export function vueAutoRouter(options?: AutoRouterOptions): Plugin {
  const mergedOptions = mergeOptions(options);
  let generator: RouteGenerator;
  let isInitialized = false;
  let server: ViteDevServer | null = null;
  let isGenerating = false;
  let pendingRegeneration = false;

  // 验证配置
  if (options) {
    const errors = validateOptions(options);
    if (errors.length > 0) {
      console.warn(`[${PLUGIN_NAME}] Configuration warnings:`);
      errors.forEach(error => console.warn(`  - ${error}`));
    }
  }

  // 防抖生成路由的方法
  const generateRoutesDebounced = (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return async (trigger: string, delay = 100) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        if (isGenerating) {
          pendingRegeneration = true;
          return;
        }
        
        await generateRoutes(trigger);
        
        if (pendingRegeneration) {
          pendingRegeneration = false;
          setTimeout(() => generateRoutes("Pending regeneration"), 50);
        }
      }, delay);
    };
  })();

  // 生成路由的统一方法
  const generateRoutes = async (trigger: string) => {
    if (isGenerating) return;
    
    try {
      isGenerating = true;
      console.log(`🔄 [${PLUGIN_NAME}] ${trigger}, regenerating routes...`);
      
      await generator.writeFiles();
      
      // 在开发模式下，通知Vite重新加载路由模块
      if (server) {
        await invalidateRouteModules();
      }
      
      console.log(`✅ [${PLUGIN_NAME}] Routes regenerated successfully`);
    } catch (error) {
      console.error(`❌ [${PLUGIN_NAME}] Failed to regenerate routes:`, error);
    } finally {
      isGenerating = false;
    }
  };

  // 使路由相关模块失效，触发HMR
  const invalidateRouteModules = async () => {
    if (!server) return;

    const routeFiles = [
      mergedOptions.output.routes,
      mergedOptions.output.config,
      "src/router/index.ts"
    ];

    for (const routeFile of routeFiles) {
      const fullPath = path.resolve(server.config.root, routeFile);
      const module = server.moduleGraph.getModuleById(fullPath);
      
      if (module) {
        server.reloadModule(module);
      }
    }
  };

  // 判断是否需要重新生成路由
  const shouldRegenerateRoutes = (file: string): boolean => {
    // 标准化路径处理
    const normalizedFile = path.normalize(file);
    const scanDirPath = path.resolve(process.cwd(), mergedOptions.scanDir);
    const normalizedScanDir = path.normalize(scanDirPath);
    
    // 检查文件是否在扫描目录内
    if (!normalizedFile.startsWith(normalizedScanDir)) return false;

    // 检查文件扩展名
    if (!SUPPORTED_EXTENSIONS.includes(path.extname(file))) return false;

    // 排除组件目录和测试文件
    const relativePath = path.relative(normalizedScanDir, normalizedFile);
    const normalizedRelativePath = relativePath.replace(/\\/g, "/");
    
    return !mergedOptions.exclude.some(excludePattern => {
      const cleanPattern = excludePattern.replace(/\*\*/g, "").replace(/\*/g, "");
      return normalizedRelativePath.includes(cleanPattern);
    });
  };

  // 设置文件监听器
  const setupFileWatcher = (server: ViteDevServer) => {
    const scanDirPath = path.resolve(server.config.root, mergedOptions.scanDir);
    const normalizedScanDir = path.normalize(scanDirPath);
    
    // 只监听扫描目录
    if (fs.existsSync(normalizedScanDir)) {
      server.watcher.add(normalizedScanDir);
    }

    // 防抖缓存，避免重复检查
    const fileCheckCache = new Map<string, boolean>();
    const CACHE_TTL = 1000; // 1秒缓存

    const shouldRegenerateRoutesWithCache = (file: string): boolean => {
      const now = Date.now();
      const cacheKey = file;
      const cached = fileCheckCache.get(cacheKey);
      
      if (cached !== undefined) {
        // 清理过期缓存
        setTimeout(() => fileCheckCache.delete(cacheKey), CACHE_TTL);
        return cached;
      }
      
      const result = shouldRegenerateRoutes(file);
      fileCheckCache.set(cacheKey, result);
      
      // 设置缓存过期
      setTimeout(() => fileCheckCache.delete(cacheKey), CACHE_TTL);
      
      return result;
    };

    const handleFileChange = (eventType: string) => (file: string) => {
      if (shouldRegenerateRoutesWithCache(file)) {
        const fileName = path.basename(file);
        generateRoutesDebounced(`File ${eventType}: ${fileName}`);
      }
    };

    // 监听文件变化事件
    server.watcher.on("add", handleFileChange("added"));
    server.watcher.on("unlink", handleFileChange("removed"));
    
    // 对于change事件，使用更长的防抖延迟，避免频繁重新生成
    server.watcher.on("change", (file: string) => {
      if (shouldRegenerateRoutesWithCache(file)) {
        const fileName = path.basename(file);
        generateRoutesDebounced(`File changed: ${fileName}`, 300);
      }
    });
  };

  return {
    name: PLUGIN_NAME,
    
    // 确保在其他插件之前运行
    enforce: "pre",

    // 插件配置
    configResolved(config) {
      try {
        generator = new RouteGenerator(mergedOptions, config.root);
        isInitialized = true;
      } catch (error) {
        console.error(`[${PLUGIN_NAME}] Failed to initialize generator:`, error);
      }
    },

    // 构建开始时生成路由
    async buildStart() {
      if (isInitialized && generator) {
        await generateRoutes("Build started");
      }
    },

    // 开发模式下监听文件变化
    configureServer(devServer) {
      if (!isInitialized) return;
      
      server = devServer;
      setupFileWatcher(devServer);
    },
  };
}

// 导出类型和工具
export type { AutoRouterOptions, RouteMeta, NamingConfig, HomeRouteConfig, NotFoundConfig, OutputConfig } from "./types";
export { mergeOptions } from "./utils";
export { RouteGenerator } from "./generator";

// 默认导出
export default vueAutoRouter;

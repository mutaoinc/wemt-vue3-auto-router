import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { RouteRecordRaw } from "vue-router";
import type { InternalAutoRouterOptions } from "./types";
import { scanFiles, generateRoutePath, generateRouteName, generatePageTitle, generateImportStatement, parseVueFileRouteMeta, isHomePageFile, normalizePath } from "./utils";
import { generateRoutesTemplate, generateConfigTemplate, generateGuardsTemplate } from "./templates";

// 路由生成器类
export class RouteGenerator {
  private options: InternalAutoRouterOptions;
  private root: string;
  private lastGeneratedHash: string = "";

  constructor(options: InternalAutoRouterOptions, root: string) {
    this.options = options;
    this.root = root;
  }

  // 生成路由配置
  async generateRoutes(): Promise<RouteRecordRaw[]> {
    const routes: RouteRecordRaw[] = [];
    const files = await scanFiles(this.options, this.root);
    const pathMap = new Map<string, string>(); // 用于检测路径冲突

    // 生成普通路由
    for (const file of files) {
      if (!this.isNotFoundComponent(file)) {
        const route = this.createRouteFromFile(file);
        
        // 检查路径冲突
        if (pathMap.has(route.path)) {
          const existingFile = pathMap.get(route.path);
          console.warn(`[Route Conflict] Path "${route.path}" is used by multiple files:`);
          console.warn(`  - ${existingFile}`);
          console.warn(`  - ${file}`);
          console.warn(`  Only the first one will be used. Consider renaming one of the files.`);
          continue; // 跳过冲突的路由
        }
        
        pathMap.set(route.path, file);
        routes.push(route);
      }
    }

    // 添加404路由
    if (this.options.notFound.enabled) {
      routes.push(this.createNotFoundRoute());
    }

    return routes;
  }

  // 检查是否为404页面组件
  private isNotFoundComponent(file: string): boolean {
    if (!this.options.notFound.enabled || !this.options.notFound.component) {
      return false;
    }
    const notFoundComponentPath = normalizePath(path.resolve(this.root, this.options.notFound.component));
    const normalizedFile = normalizePath(file);
    return normalizedFile === notFoundComponentPath;
  }

  // 从文件创建路由对象
  private createRouteFromFile(file: string): RouteRecordRaw {
    const routePath = generateRoutePath(file, this.options);
    const routeName = generateRouteName(file, this.options);
    const pageTitle = generatePageTitle(file, this.options);
    const importStatement = generateImportStatement(file, this.options);
    
    // 获取文件的相对路径信息
    const normalizedPath = normalizePath(file);
    const scanDirPath = normalizePath(path.resolve(process.cwd(), this.options.scanDir));
    const relativePath = path.relative(scanDirPath, normalizedPath);
    const pathInfo = path.parse(relativePath);
    const dirPath = normalizePath(pathInfo.dir);
    
    // 判断是否为首页文件
    const isHomePageFile_ = isHomePageFile(file, this.options);
    
    // 判断是否为根目录首页（文件在根目录且是首页文件）
    const isRootHomePage = (dirPath === '' || dirPath === '.') && isHomePageFile_;
    
    const vueRouteMeta = parseVueFileRouteMeta(file);

    // 根目录首页：绑定到根路径 /
    if (isRootHomePage) {
      return {
        path: this.options.homeRoute.path || "/",
        name: this.options.homeRoute.name,
        component: importStatement as any,
        meta: {
          title: vueRouteMeta?.title || pageTitle,
          ...this.options.meta,
          ...vueRouteMeta,
        },
      };
    }
    
    // 子目录首页：绑定到子目录路径
    if (isHomePageFile_) {
      return {
        path: `/${dirPath}`,
        name: dirPath.replace(/\//g, '-'),
        component: importStatement as any,
        meta: {
          title: vueRouteMeta?.title || pageTitle,
          ...this.options.meta,
          ...vueRouteMeta,
        },
      };
    }
    
    // 普通页面：使用完整路径
    return {
      path: `/${routePath}`,
      name: routeName,
      component: importStatement as any,
      meta: {
        title: vueRouteMeta?.title || pageTitle,
        ...this.options.meta,
        ...vueRouteMeta,
      },
    };
  }

  // 创建404路由
  private createNotFoundRoute(): RouteRecordRaw {
    const routerDir = path.dirname(this.options.output.routes);
    const notFoundPath = path.resolve(this.root, this.options.notFound.component);
    const relativeNotFoundPath = normalizePath(path.relative(routerDir, notFoundPath));

    return {
      path: this.options.notFound.path,
      name: this.options.notFound.name,
      component: `() => import('${relativeNotFoundPath}')` as any,
      meta: {
        title: "404 Not Found",
        hidden: true,
        ...this.options.meta,
      },
    };
  }

  // 生成文件内容
  async generateRoutesFile(): Promise<string> {
    const routes = await this.generateRoutes();
    return generateRoutesTemplate(routes);
  }

  generateConfigFile(): string {
    return generateConfigTemplate(this.options);
  }

  generateGuardsFile(): string {
    return generateGuardsTemplate(this.options);
  }

  // 写入文件
  async writeFiles(): Promise<void> {
    try {
      const [routesContent, configContent] = await Promise.all([
        this.generateRoutesFile(),
        Promise.resolve(this.generateConfigFile()),
      ]);

      // 只有在guards文件不存在时才生成，避免覆盖用户自定义的guards
      let guardsContent = "";
      const guardsPath = path.resolve(this.root, this.options.output.guards);
      let shouldWriteGuards = false;
      
      if (!fs.existsSync(guardsPath)) {
        guardsContent = this.generateGuardsFile();
        shouldWriteGuards = true;
      }

      // 计算内容哈希，避免不必要的重新生成
      const contentForHash = routesContent + configContent + (shouldWriteGuards ? guardsContent : "");
      const contentHash = this.calculateContentHash(contentForHash);
      if (contentHash === this.lastGeneratedHash) {
        return;
      }

      const { routes, config, guards } = this.options.output;

      // 写入文件
      this.writeFileIfChanged(path.resolve(this.root, routes), routesContent);
      this.writeFileIfChanged(path.resolve(this.root, config), configContent);
      
      // 只在首次生成时写入guards文件
      if (shouldWriteGuards) {
        this.writeFileIfChanged(path.resolve(this.root, guards), guardsContent);
        console.log(`🛡️ [${path.basename(guards)}] Guards file generated. You can customize it now.`);
      }

      this.lastGeneratedHash = contentHash;
    } catch (error) {
      console.error("Error writing route files:", error);
      throw error;
    }
  }

  // 计算内容哈希
  private calculateContentHash(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex");
  }

  // 写入文件（如果内容有变化）
  private writeFileIfChanged(filePath: string, content: string): void {
    if (fs.existsSync(filePath)) {
      try {
        const existingContent = fs.readFileSync(filePath, "utf-8");
        if (existingContent === content) return;
      } catch {
        // 继续写入
      }
    }

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 原子性写入
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, content, "utf-8");
    fs.renameSync(tempPath, filePath);
  }
}

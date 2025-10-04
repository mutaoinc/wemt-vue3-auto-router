import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { RouteRecordRaw } from "vue-router";
import type { InternalAutoRouterOptions } from "./types";
import { scanFiles, generateRoutePath, generateRouteName, generatePageTitle, generateImportStatement, parseVueFileRouteMeta, PLUGIN_NAME } from "./utils";
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

    // 生成普通路由
    for (const file of files) {
      if (!this.isNotFoundComponent(file)) {
        routes.push(this.createRouteFromFile(file));
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
    const notFoundComponentPath = path.resolve(this.root, this.options.notFound.component);
    return file === notFoundComponentPath;
  }

  // 从文件创建路由对象
  private createRouteFromFile(file: string): RouteRecordRaw {
    const routePath = generateRoutePath(file, this.options);
    const routeName = generateRouteName(file, this.options);
    const pageTitle = generatePageTitle(file, this.options);
    const importStatement = generateImportStatement(file, this.options);
    
    // 修复首页路由判断逻辑
    const fileName = path.basename(file, path.extname(file)).toLowerCase();
    const isHomePage = routePath === "" || routePath === "index" || fileName === "home" || fileName === "index";
    
    const vueRouteMeta = parseVueFileRouteMeta(file);

    return {
      path: isHomePage ? this.options.homeRoute.path || "/" : `/${routePath}`,
      name: isHomePage ? this.options.homeRoute.name : routeName,
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
    const relativePath = path.relative(routerDir, notFoundPath);
    const normalizedPath = relativePath.replace(/\\/g, "/");

    return {
      path: this.options.notFound.path,
      name: this.options.notFound.name,
      component: `() => import('${normalizedPath}')` as any,
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

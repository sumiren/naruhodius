import fs from "node:fs";
import path from "node:path";

export class DirectoryScanner {
  static async scanDirectory(basePath: string, excludeDirs: string[] = ["node_modules", ".git", ".idea", "dist"]): Promise<any> {
    const result: any = {};

    async function scan(dir: string, parent: any) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          parent[entry.name] = {};
          await scan(path.join(dir, entry.name), parent[entry.name]);
        } else if (entry.isFile()) {
          if (!parent.files) {
            parent.files = [];
          }
          parent.files.push(entry.name);
        }
      }
    }

    await scan(basePath, result);
    return result;
  }
}

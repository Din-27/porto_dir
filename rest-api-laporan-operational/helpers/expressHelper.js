import express from 'express';
import fs from 'fs/promises';
import path from 'path';

async function readAllroute(routerPath) {
  const files = await fs.readdir(routerPath);
  const routerFileList = [];

  for (let i = 0; i < files.length; i += 1) {
    const filePath = path.join(routerPath, files[i]);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const childPath = await readAllroute(filePath);
      routerFileList.push(...childPath);
    } else {
      routerFileList.push(filePath);
    }
  }
  return routerFileList;
}
export async function routerLoader(routerPath) {
  const router = express.Router();
  const routeFiles = await readAllroute(path.join(process.cwd(), routerPath));
  const importPromises = routeFiles.map(async (file) => {
    const routeModule = await import(`${file.replace(process.cwd(), '..').replace(/\\/g, '/')}`);
    return routeModule.default;
  });

  const routeModules = await Promise.all(importPromises);

  routeModules.forEach((routeModule) => {
    if (routeModule) {
      router.use('/', routeModule);
    }
  });

  logger.info('[Router Loader] finish load all route.');
  return router;
}

export function runAsyncRouter(cb) {
  return (req, res, next) => {
    cb(req, res, next).catch(next);
  };
}

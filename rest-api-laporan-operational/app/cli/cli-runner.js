import '../../helpers/global.js';
import fs from 'fs';
import path from 'path';
import consoleLogger from '../../infra/Logger/consoleLogger.js';

async function validateArgumen({ type, argument, args }) {
  const argumentList = {
    '--p': '<file-path>',
  };
  const pathIndex = args.indexOf(argument);

  if (pathIndex === -1 || pathIndex === args.length - 1) {
    consoleLogger.error(`make:${type} memerlukan argumen ${argument} ${argumentList[argument]}`);
    return process.exit(1);
  }
  return args[pathIndex + 1];
}

function createDir(filePath, parentPath) {
  const pathSplit = filePath.split('/');

  if (pathSplit.length <= 1) return false;

  pathSplit.splice(pathSplit.length - 1, 1);
  const dir = path.join(parentPath, pathSplit.join('/'));

  if (fs.existsSync(dir)) return false;

  fs.mkdirSync(dir, { recursive: true });
  return true;
}

async function make(args) {
  const type = args[0].replace(/^make:/, '');
  const STUB_BASE_PATH = path.join(process.cwd(), '/app/cli/stubs');
  const fileTypes = {
    route: 'route',
    service: 'service',
  };

  if (!fileTypes[type]) {
    consoleLogger.error(
      'Invalid type argument. Supported types are: route, service',
      `Received ${type}`,
    );
    process.exit(1);
  }

  let filePath = await validateArgumen({ type, argument: '--p', args });
  const stubFilePath = path.join(STUB_BASE_PATH, `${fileTypes[type]}.stub`);

  let stubContent = fs.readFileSync(stubFilePath, 'utf-8');
  let fileDir;
  switch (type) {
    case 'route':
      fileDir = path.join(process.cwd(), 'app/http/routers');
      createDir(filePath, fileDir);
      filePath = path.join(fileDir, filePath);
      break;
    case 'service': {
      fileDir = path.join(process.cwd(), 'services');
      createDir(filePath, fileDir);

      const className = () => {
        const splitStr = filePath.split('/');
        let name = '';

        if (splitStr.length > 0) {
          name = splitStr[splitStr.length - 1];
        }

        name = name.charAt(0).toUpperCase() + name.slice(1);
        return name;
      };
      stubContent = stubContent.replace(/MyService/g, className);
      filePath = path.join(process.cwd(), `services/${filePath}`);
      break;
    }
    // no default
  }

  if (fs.existsSync(`${filePath}.js`)) {
    consoleLogger.error(`File ${filePath} sudah tersedia.`);
    process.exit(0);
  }

  fs.writeFile(`${filePath}.js`, stubContent, (err) => {
    if (err) {
      consoleLogger.error('Error creating the file : ', err);
    } else {
      consoleLogger.success(`File created at ${filePath}`);
    }
  });
}

try {
  const args = process.argv.slice(2);
  switch (true) {
    case /^make:(\w+)$/.test(args[0]): await make(args); break;
    default:
      consoleLogger.error('Command action untuk cli-runner tidak ditemukan atau tidak valid.');
      console.log('Command yang tersedia');
      console.table([
        { command: 'make:<type>', args: '--p <file-path>' },
      ]);
      process.exit(1);
  }
} catch (error) {
  myDumpErr(error);
  process.exit(0);
}

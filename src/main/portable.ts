import { dirname, isAbsolute, join } from 'node:path';
export function portableDataPath(options: {
  packaged: boolean;
  executable: string;
  appPath: string;
  platform: NodeJS.Platform;
  appImage?: string;
}): string {
  if (!options.packaged) return join(options.appPath, 'data');
  // AppImage executables run inside a read-only mount or temporary extraction.
  // APPIMAGE points to the persistent file chosen by the user in both modes.
  if (options.platform === 'linux' && options.appImage) {
    if (!isAbsolute(options.appImage)) throw new Error('APPIMAGE deve conter um caminho absoluto.');
    return join(dirname(options.appImage), 'data');
  }
  return join(dirname(options.executable), 'data');
}

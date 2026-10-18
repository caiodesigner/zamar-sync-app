const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { portableDataPath } = require('../dist/main/portable.js');
test('AppImage keeps data next to original image, outside ephemeral mount or extraction', () => {
 const image = join(process.cwd(),'portátil','Zamar.AppImage');
 for (const executable of ['/tmp/.mount_zamar/zamar-sync', '/tmp/appimage-extract/zamar-sync']) {
  assert.equal(portableDataPath({packaged:true,platform:'linux',executable,appPath:'/tmp/app.asar',appImage:image}),join(process.cwd(),'portátil','data'));
 }
});
test('folder package and development retain their own data; Windows ignores APPIMAGE', () => {
 const root = join(process.cwd(),'portátil');
 assert.equal(portableDataPath({packaged:true,platform:process.platform,executable:join(root,'zamar-sync'),appPath:'/ignored'}),join(root,'data'));
 assert.equal(portableDataPath({packaged:false,platform:'linux',executable:'/ignored',appPath:root,appImage:'/ignored.AppImage'}),join(root,'data'));
 assert.equal(portableDataPath({packaged:true,platform:'win32',executable:join(root,'Zamar Sync.exe'),appPath:'/ignored',appImage:'/ignored.AppImage'}),join(root,'data'));
});
test('relative AppImage location is rejected instead of writing into a transient location', () => {
 assert.throws(() => portableDataPath({packaged:true,platform:'linux',executable:'/tmp/zamar',appPath:'/tmp',appImage:'relative.AppImage'}));
});

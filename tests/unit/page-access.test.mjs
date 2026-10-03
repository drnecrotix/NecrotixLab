import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../../src/lib/page-access.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function access(mode,role) {
 const exports={};
 const mocks={
  'next/navigation':{notFound:()=>{throw Error('404');}},
  '@/auth':{auth:async()=>role?{user:{role}}:null},
  '@/lib/prisma':{prisma:{page:{findUnique:async()=>({content:{journey:mode}})}}},
 };
 vm.runInNewContext(source,{exports,require:(name)=>mocks[name]});
 return exports;
}
test('public pages remain accessible',async()=>{assert.equal(await access('PUBLIC').requireManagedPageAccess('journey'),true);});
test('admin-only pages show development notice to guests and non-admin users',async()=>{
 for(const role of [undefined,'USER','EDITOR']) assert.equal(await access('ADMIN_ONLY',role).requireManagedPageAccess('journey'),false);
});
test('owners and admins retain their page preview',async()=>{
 for(const role of ['OWNER','ADMIN']) assert.equal(await access('ADMIN_ONLY',role).requireManagedPageAccess('journey'),true);
});
test('disabled pages remain unavailable to everyone',async()=>{
 for(const role of [undefined,'OWNER','ADMIN']) await assert.rejects(access('DISABLED',role).requireManagedPageAccess('journey'),/404/);
});
test('development notice does not make restricted pages public for navigation or sitemap',()=>{
 const a=access('ADMIN_ONLY');const settings=a.normalizeManagedPageAccessSettings({journey:'ADMIN_ONLY'});
 assert.equal(a.canAccessManagedPage(settings,'journey',false),false);assert.equal(a.isManagedPagePublic(settings,'journey'),false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../../src/app/api/resume/download/route.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route({key='uploads/cv.pdf',url='/uploads/cv.pdf',enabled=true,fail=false,asset=true}={}) {
 const calls=[];
 class Response extends globalThis.Response { static json(body, options) { return new Response(JSON.stringify(body),options); } }
 const exports={};
 const mocks={
  'next/server':{NextResponse:Response},
  'node:fs/promises':{readFile:async()=>{calls.push('default'); return Buffer.from('%PDF-default');}},
  'node:path':{default:{join:(...parts)=>parts.join('/')}},
  '@/lib/prisma':{prisma:{page:{findUnique:async()=>({content:{}})},mediaAsset:{findFirst:async()=>asset ? {key,url,fileName:'CV.pdf',mimeType:'application/pdf'} : null}}},
  '@/lib/resume-settings':{RESUME_CONFIG_SLUG:'__resume-config',normalizeResumeSettings:()=>({enabled,downloadPdfUrl:url})},
  '@/lib/media-storage':{isManagedMediaKey:(value)=>value.startsWith('uploads/')||value.startsWith('media/'),readMediaFile:async(value)=>{calls.push(value);if(fail)throw Error('storage secret');return Buffer.from('%PDF-managed');}},
 };
 vm.runInNewContext(source,{exports,require:(name)=>mocks[name],process:{cwd:()=>'/app'},console:{error:()=>{}},Uint8Array,URL,AbortSignal,fetch:async()=>{calls.push('fetch');return new Response('%PDF-external');}});
 return {get:()=>exports.GET(new Request('https://site.test/api/resume/download')),calls};
}
for (const key of ['uploads/cv.pdf','media/cv.pdf']) test(`CV reads ${key} without an HTTP self-request`,async()=>{
 const r=route({key});const response=await r.get();assert.equal(response.status,200);assert.equal(await response.text(),'%PDF-managed');assert.deepEqual(r.calls,[key]);assert.match(response.headers.get('content-disposition'),/attachment/);
});
test('default bundled CV and registered external PDFs remain downloadable',async()=>{
 const bundled=route({url:'/resume.pdf'});assert.equal((await bundled.get()).status,200);assert.deepEqual(bundled.calls,['default']);
 const external=route({key:'external:cv',url:'https://files.test/cv.pdf'});assert.equal((await external.get()).status,200);assert.deepEqual(external.calls,['fetch']);
});
test('missing registration and disabled resume do not read storage',async()=>{
 for(const options of [{asset:false},{enabled:false}]){const r=route(options);assert.equal((await r.get()).status,404);assert.deepEqual(r.calls,[]);}
});
test('storage errors return a useful response without exposing internal details',async()=>{
 const r=route({fail:true});const response=await r.get();assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/storage secret|fetch failed/);
});

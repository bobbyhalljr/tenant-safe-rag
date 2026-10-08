import assert from 'node:assert/strict';

type Principal = { tenantId: string; groups: readonly string[] };
type Request = { query: string };
type Doc = { id: string; tenantId: string; groups: readonly string[]; text: string };
type Hit = Doc & { score: number };

// Synthetic ranking scores for ONE query. This is not an embedding model.
const query = 'refund policy';
const docs: Doc[] = [
  { id: 'b1', tenantId: 'beta', groups: ['support'], text: 'Beta private refund policy' },
  { id: 'b2', tenantId: 'beta', groups: ['support'], text: 'Beta private refund exception' },
  { id: 'a-hr', tenantId: 'acme', groups: ['hr'], text: 'Acme private employee refund' },
  { id: 'a1', tenantId: 'acme', groups: ['support'], text: 'Acme refund policy' },
  { id: 'a2', tenantId: 'acme', groups: ['support'], text: 'Acme refund exception' },
  { id: 'a3', tenantId: 'acme', groups: ['support'], text: 'Acme refund FAQ' }
];
const scores: Record<string, number> = { b1: 0.99, b2: 0.98, 'a-hr': 0.95, a1: 0.91, a2: 0.89, a3: 0.80 };
const principal: Principal = { tenantId: 'acme', groups: ['support'] };

// Production: derive this scope from verified server-side authentication and ACLs.
// Never trust a tenantId/group supplied by the model or request body.
function allowed(doc: Doc, scope: Principal | null): boolean {
  return scope !== null && doc.tenantId === scope.tenantId
    && doc.groups.some(group => scope.groups.includes(group));
}
function rank(candidates: readonly Doc[], request: Request, k: number): Hit[] {
  if (!Number.isInteger(k) || k < 1) throw new Error('invalid k');
  if (request.query !== query) throw new Error('demo supports one fixed query');
  return candidates.map(doc => ({ ...doc, score: scores[doc.id]! }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, k);
}
function retrieve(request: Request, scope: Principal | null, k: number, corpus = docs): Hit[] {
  return rank(corpus.filter(doc => allowed(doc, scope)), request, k);
}
const request: Request = { query };
const globalTop = rank(docs, request, 2);
const postFiltered = globalTop.filter(doc => allowed(doc, principal));
assert.deepEqual(postFiltered, []);
console.log('post-filter: returned=0, authorized top-2 recall=0/2');

const safe = retrieve(request, principal, 2);
assert.deepEqual(safe.map(doc => doc.id), ['a1', 'a2']);
assert(safe.every(doc => allowed(doc, principal)));
console.log('pre-filter: ids=a1,a2, authorized top-2 recall=2/2');

// An intentionally unsafe reranker boundary. Both texts leave the trusted store.
const rerankerInput = globalTop.map(doc => doc.text);
assert.equal(rerankerInput.filter(text => text.startsWith('Beta')).length, 2);
console.log('late access check: foreign texts sent to reranker=2');

assert(!safe.some(doc => doc.id === 'a-hr'));
console.log('same-tenant HR document: excluded');

const forgedRequest = { query, tenantId: 'beta', groups: ['hr'] };
assert.deepEqual(retrieve(forgedRequest, principal, 2).map(doc => doc.id), ['a1', 'a2']);
console.log('forged request scope: ignored, ids=a1,a2');

assert.deepEqual(retrieve(request, null, 2), []);
console.log('missing authentication: returned=0');

const revoked = docs.map(doc => doc.id === 'a1' ? { ...doc, groups: ['hr'] } : doc);
assert.deepEqual(retrieve(request, principal, 2, revoked).map(doc => doc.id), ['a2', 'a3']);
console.log('revoked a1: ids=a2,a3');

assert.throws(() => retrieve(request, principal, 0), /invalid k/);
console.log('invalid k: rejected');
console.log('All 8 scenario checks passed.');

# Tenant-safe RAG in TypeScript

A small, dependency-free example of applying access checks **before top-k retrieval**. It compares post-filtering, pre-filtering and a deliberately unsafe late check before a reranker.

Article: [Your RAG Filter Runs Too Late](https://dev.to/bobbyhalljr/your-rag-filter-runs-too-late-build-a-tenant-safe-retriever-in-typescript-5elk).

## Prerequisites and exact commands

Node.js 22.18 or newer, with native TypeScript stripping. No API key, network calls or embedding model.

```sh
git clone https://github.com/bobbyhalljr/tenant-safe-rag.git
cd tenant-safe-rag
node --experimental-strip-types rag.ts
```

Or run `npm test`. No install is required.

## Fixtures and expected output

Six synthetic documents, one query (`refund policy`), explicit scores, two tenants and two access groups. All fixtures live in `rag.ts`. Higher scores rank first; ID breaks ties.

```text
post-filter: returned=0, authorized top-2 recall=0/2
pre-filter: ids=a1,a2, authorized top-2 recall=2/2
late access check: foreign texts sent to reranker=2
same-tenant HR document: excluded
forged request scope: ignored, ids=a1,a2
missing authentication: returned=0
revoked a1: ids=a2,a3
invalid k: rejected
All 8 scenario checks passed.
```

## What it proves

Post-filtering the global top two loses both authorized best matches. Filtering the eligible corpus first returns a1 and a2. A check after an external reranker sees the text cannot retract it. A client-supplied tenant/group field does not change the trusted principal.

## Limitations

This is a teaching fixture, not a production authorization system or vector database. Scores are hand-set. Recall is measured against the fixture's exact authorized top two, not a real retrieval benchmark. The principal is constructed locally; production must authenticate it. No ACL database, concurrent updates, distributed caches, approximate-nearest-neighbor index, reranker API or model calls are tested. No broad leak-prevention guarantee is made.

Enforce permissions in the data layer and before text leaves it. Apply checks to rerankers, traces, caches and citations as well as the final answer. Permission changes need cache invalidation or a fresh check. Test under the actual production database role.

## Primary references

- [Azure AI Search vector query filters](https://learn.microsoft.com/en-us/azure/search/vector-search-filters)
- [PostgreSQL row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Node.js TypeScript support](https://nodejs.org/api/typescript.html)

## License

MIT.

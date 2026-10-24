# SempreGanhe auxiliary reviewers

These are read-only reviewer definitions used by the main agent. They do not own implementation and cannot edit files, mutate databases, commit, publish, or change configuration.

## Routing

| Change area | Reviewer | Execution rule |
|---|---|---|
| Schema, migration, enum, index, query, Drizzle snapshot, persistence | `database-reviewer.md` | Run before implementation decisions are finalized; include callers and tests. |
| Authentication, authorization, sessions, users, customers, participation, partner-scoped data | `security-data-scope-reviewer.md` | Run before merging the change; inspect every affected endpoint and data path. |
| UI, identity, CSS, assets, components, or deploy visibility | `production-ui-reviewer.md` | Run before deployment; trace source assets/styles to rendered production routes. |

When a change matches more than one area, run the reviewers serially if they share files, migrations, database state, ports, builds, or services. Parallel execution is allowed only for independent read-only scopes with no shared state. Do not create additional reviewers unless a recurring concrete category is not covered here.

## Invocation contract

The main agent supplies the repository path and the change scope. Each reviewer must inspect the diff, callers, contracts, tests, and connected files before reporting. The reviewer returns only the required report format from its definition. The main agent decides whether to implement corrections, run integration checks, commit, and deploy.

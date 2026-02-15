---
name: stage-writing
description: >
  Guides how to scope and write growth stages. Trigger when planning
  new stages, deciding what to include or exclude, or splitting work.
---

# Stage Writing

## One Intent = One Stage

Each stage has a single purpose. If you can't describe it in one
sentence, it's too big. A stage is a **vertical slice** -- it touches
every layer needed (API + service + DB + test) to deliver that one
intent.

## Vertical Slicing

Cut through all layers, not across them:

- **Yes**: "Add user creation endpoint with validation, persistence,
  and tests"
- **No**: "Build all the database schemas first, then all the services"

Each stage produces a working system. A seedling is a whole plant,
not 10% of a tree.

## Growth Progression

Stages follow a natural progression from simple to sophisticated:

1. **Hardcoded** -- return a fixed value to prove the path works
2. **Configurable** -- accept parameters, read from config
3. **Dynamic** -- compute from real data, connect to services
4. **Optimized** -- add caching, batching, performance tuning

Don't jump ahead. A hardcoded stage that works is better than a
dynamic stage that doesn't.

## When to Split

Split a stage if:

- It touches more than one domain concept
- It requires more than ~200 lines of new code
- You find yourself saying "and also..."
- The commit message needs two verbs

## When to Combine

Combine stages if:

- One is just renaming or moving a file
- Neither makes sense without the other
- The split creates a broken intermediate state

## Stage Contract

Every stage defines:

- **Properties** -- what must be true when done
- **Depends on** -- which earlier properties it relies on
- **Captures** -- what new properties it establishes

After the stage, the build passes, all tests pass, and the app runs.

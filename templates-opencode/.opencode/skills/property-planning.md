---
name: property-planning
description: >
  Guides property-based planning for growth stages. Trigger when writing
  growth plans, defining stage properties, or converting requirements into
  testable assertions.
---

# Property-Based Planning

Properties are rules that must be true **after** a stage is complete.
They describe *what the system guarantees*, not *how the code works*.

## Property Categories

### Invariants
Rules that are **always true**, regardless of input or state.

- "Every response has a valid JSON body"
- "The user count never decreases after an insert"
- "All timestamps are in UTC"

Test pattern: assert the invariant holds across a range of inputs.

### State Transitions
Rules about **before/after** relationships when an action occurs.

- "After creating an order, the order appears in the list"
- "After deleting a user, their sessions are also removed"
- "Status moves from pending to active, never backwards"

Test pattern: capture state before, perform action, assert state after.

### Roundtrips
Rules about **serialize/deserialize** or **save/load** symmetry.

- "Encoding then decoding returns the original value"
- "Saving an entity then loading it produces an equal entity"
- "Exporting to CSV then importing yields the same rows"

Test pattern: `assert.deepEqual(decode(encode(x)), x)`.

### Boundaries
Rules about **edge cases, limits, and error conditions**.

- "Empty input returns an empty result, not an error"
- "Payloads over 1MB are rejected with a 413 status"
- "Unicode characters in names are preserved"

Test pattern: test at the boundary value, one below, one above.

## Mapping Properties to Tests

Each property becomes one or more test assertions:

```
Property: "P1: created items appear in the list [state transition]"
Test:     create an item, fetch the list, assert the item is present
```

Good properties are **falsifiable** -- you can write a test that would
fail if the property were violated.

## Anti-Patterns

- **Testing implementation**: "the function calls the database twice"
  -- this tests *how*, not *what*.
- **Vague properties**: "the system works correctly" -- not falsifiable.
- **One giant property**: split into specific, independent assertions.
- **Coupling to internals**: "the cache key is `user:{id}`" -- this
  breaks when the implementation changes.

## Property Accumulation

Properties from earlier stages remain true in later stages.
A stage can **depend on** earlier properties (via `Depends on: P1, P2`)
and **add** new ones. The full set of properties is the system's
contract at any point in time.

/**
 * Utility types used across the codebase.
 */

/**
 * Recursively makes all properties of T (and nested objects) readonly.
 * Used extensively with ToolPermissionContext and AppState to enforce
 * immutability at the type level.
 */
export type DeepImmutable<T> = T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>>
  : T extends ReadonlySet<infer S>
    ? ReadonlySet<DeepImmutable<S>>
    : T extends readonly (infer R)[]
      ? readonly DeepImmutable<R>[]
      : T extends object
        ? { readonly [K in keyof T]: DeepImmutable<T[K]> }
        : T

/**
 * Ensures a tuple contains exactly every member of union T (no more, no less).
 * Used with `satisfies Permutations<...>` to get compile-time exhaustiveness
 * checks on arrays that must list every variant of a union.
 *
 * Example:
 *   const modes = ['a', 'b'] satisfies Permutations<'a' | 'b'>
 */
export type Permutations<T extends string> = readonly T[]

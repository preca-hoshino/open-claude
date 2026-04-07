// Bun text loader: import X from './file.md' resolves to a string at build time
declare module '*.md' {
  const content: string
  export default content
}

declare module '*.txt' {
  const content: string
  export default content
}

// Make React namespace available globally for .ts files that use React.ReactNode
// without explicitly importing React
declare namespace React {
  type ReactNode = import('react').ReactNode
  type RefObject<T> = import('react').RefObject<T>
  type MutableRefObject<T> = import('react').MutableRefObject<T>
  type Dispatch<A> = import('react').Dispatch<A>
  type SetStateAction<S> = import('react').SetStateAction<S>
}

// React Compiler runtime - provides caching primitives used by React Compiler output
declare module 'react/compiler-runtime' {
  export function c(size: number): any[]
}

// Ink custom JSX intrinsic elements
declare namespace JSX {
  interface IntrinsicElements {
    'ink-box': any
    'ink-text': any
    'ink-link': any
    'ink-root': any
    'ink-virtual-text': any
  }
}

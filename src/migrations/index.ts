import * as migration_20260915_101842_initial from './20260915_101842_initial'

export const migrations = [
  {
    up: migration_20260915_101842_initial.up,
    down: migration_20260915_101842_initial.down,
    name: '20260915_101842_initial',
  },
]

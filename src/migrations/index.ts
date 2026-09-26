import * as migration_20260915_101842_initial from './20260915_101842_initial';
import * as migration_20260918_152210_catalog from './20260918_152210_catalog';
import * as migration_20260925_114506_price_list_import from './20260925_114506_price_list_import';

export const migrations = [
  {
    up: migration_20260915_101842_initial.up,
    down: migration_20260915_101842_initial.down,
    name: '20260915_101842_initial',
  },
  {
    up: migration_20260918_152210_catalog.up,
    down: migration_20260918_152210_catalog.down,
    name: '20260918_152210_catalog',
  },
  {
    up: migration_20260925_114506_price_list_import.up,
    down: migration_20260925_114506_price_list_import.down,
    name: '20260925_114506_price_list_import'
  },
];

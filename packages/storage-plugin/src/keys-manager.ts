import {
  Injectable,
  Injector,
  inject,
  EnvironmentProviders,
  ENVIRONMENT_INITIALIZER,
  makeEnvironmentProviders
} from '@angular/core';
import {
  STORAGE_ENGINE,
  StorageEngine,
  StorageKey,
  ɵextractStringKey,
  NgxsStoragePluginOptions,
  ɵisKeyWithExplicitEngine,
  ɵNGXS_STORAGE_PLUGIN_OPTIONS
} from '@ngxs/storage-plugin/internals';

interface KeyWithEngine {
  key: string;
  engine: StorageEngine;
}

@Injectable({ providedIn: 'root' })
export class ɵNgxsStoragePluginKeysManager {
  readonly keysWithEngines: KeyWithEngine[] = [];

  /** Store keys separately in a set so we're able to check if the key already exists. */
  private readonly _keys = new Set<string>();

  private readonly _injector = inject(Injector);

  constructor() {
    const { key } = inject<NgxsStoragePluginOptions>(ɵNGXS_STORAGE_PLUGIN_OPTIONS);
    const storageKeys = Array.isArray(key) ? key : [key!];
    this.addKeys(storageKeys);
  }

  addKeys(storageKeys: StorageKey[]): void {
    for (const storageKey of storageKeys) {
      const key = ɵextractStringKey(storageKey);

      // The user may call `forFeature` with the same state multiple times by mistake.
      // Let's prevent duplicating state names in the `keysWithEngines` list.
      if (this._keys.has(key)) {
        continue;
      }

      this._keys.add(key);

      const engine = ɵisKeyWithExplicitEngine(storageKey)
        ? this._injector.get(storageKey.engine)
        : this._injector.get(STORAGE_ENGINE);

      this.keysWithEngines.push({ key, engine });
    }
  }
}

// TODO: MUST BE REVISITED AND RENAMED, I DON'T KNOW PROPER NAMING.
export function withStorageFeature(storageKeys: StorageKey[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => inject(ɵNgxsStoragePluginKeysManager).addKeys(storageKeys)
    }
  ]);
}

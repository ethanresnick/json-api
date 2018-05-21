// This must have a custom constructor, or Immutable will convert it to a Map.
export const minimalDummyAdapter = {
  setRegistryDerivedOptions: () => { return; },
  constructor: function() { return; }
} as any;

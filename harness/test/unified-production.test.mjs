import assert from 'node:assert/strict';
import test from 'node:test';
import {productionContract, usesCurrentProduction, assertCurrentCreation} from '../src/production-contract.mjs';

// Historical identifiers are readable; they are no longer production profiles.
test('historical contract identifiers remain readable without production admission', () => {
  for (const config of [{}, {productionContract:'legacy-v1'}, {productionContract:'unified-v1'}, {productionContract:'storyboard-v1'}]) {
    assert.ok(['legacy-v1','unified-v1','storyboard-v1'].includes(productionContract(config)));
    assert.equal(usesCurrentProduction(config),false);
  }
});
test('only the current default is admitted, with no old-version creation fallback', () => {
  assert.doesNotThrow(()=>assertCurrentCreation());
  for (const config of [{productionContract:'legacy-v1'}, {productionContract:'unified-v1'}, {storyboardSchemaVersion:1}]) assert.throws(()=>assertCurrentCreation(config), {code:'production-rework-required'});
});
test('unknown historical contracts are not silently read as a current contract', () => {
  assert.throws(()=>productionContract({productionContract:'future-contract'}), {code:'unsupported-production-contract'});
});

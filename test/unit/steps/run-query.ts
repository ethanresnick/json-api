import { expect } from "chai";
import * as td from 'testdouble';

import runQuery from '../../../src/steps/run-query'
import ResourceTypeRegistry from "../../../src/ResourceTypeRegistry";
import MongooseAdapter from '../../../src/db-adapters/Mongoose/MongooseAdapter';

import {
  FindQuery,
  CreateQuery,
  UpdateQuery,
  DeleteQuery,
  AddToRelationshipQuery,
  RemoveFromRelationshipQuery
} from "../../../src";

describe("runQuery", () => {
  const adapter = td.object(new MongooseAdapter({ }));
  const registry = new ResourceTypeRegistry({
    schools: {
      pagination: {
        defaultPageSize: 2,
        maxPageSize: 4
      }
    }
  }, {
    dbAdapter: adapter
  });

  it("should reject queries of unknown type", () => {
    const findQuery = new FindQuery({ type: "unknown" } as any);
    expect(() => runQuery(registry, findQuery)).to.throw(/Unknown resource type/);
    td.verify(adapter.find(td.matchers.anything()), { times: 0 });
  });

  it('should dispatch queries to the correct adapter method', async () => {
    const queries = {
      find: new FindQuery({ type: 'schools' } as any),
      create: new CreateQuery({ type: 'schools' } as any),
      update: new UpdateQuery({ type: 'schools' } as any),
      delete: new DeleteQuery({ type: 'schools' } as any),
      addToRelationship: new AddToRelationshipQuery({ type: 'schools', id: '1', relationshipName: 'x' } as any),
      removeFromRelationship: new RemoveFromRelationshipQuery({ type: 'schools', id: '1', relationshipName: 'x' } as any)
    };

    // Set up the adapter to resolve with method name.
    Object.keys(queries).forEach((type) => {
      td.when(adapter[type](td.matchers.anything())).thenResolve(type);
    });

    for (const type of Object.keys(queries)) {
      const query = queries[type];
      const result = await runQuery(registry, query);
      expect(result).to.deep.equal(type);
    }
  });

  it('should enforce the page size limit (by default)', async () => {
    const findQuery = new FindQuery({ type: 'schools', limit: 10 } as any);

    try {
      await runQuery(registry, findQuery);
    } catch (err) {
      expect(err.detail).to.equal('Must use a smaller limit per page.');
      return;
    }

    throw new Error('expected error');
  });

  it('should not enforce page size limits if ignoreMaxLimit is set', async () => {
    const findQuery =
      new FindQuery({ type: 'schools', limit: 10 } as any).withoutMaxLimit();

    await runQuery(registry, findQuery);

    td.verify(adapter.find(findQuery));
  });

  it('should allow non-default limits that are under the max', async () => {
    const findQuery = new FindQuery({ type: 'schools', limit: 3 } as any);

    await runQuery(registry, findQuery);

    td.verify(adapter.find(findQuery));
  });

  it('should apply max, not default, limit if no limit is provided', async () => {
    const findQuery = new FindQuery({ type: 'schools' } as any);
    td.when(adapter.find(findQuery)).thenDo(query => query.limit)

    const limit = await runQuery(registry, findQuery);
    expect(limit).to.equal(4); // max page size
  });
});

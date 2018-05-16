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
    schools: { }
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
});

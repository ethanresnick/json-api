import { expect } from "chai";
import AgentPromise from "../../app/agent";
import API from "../../../src/controllers/API";
import appPromise from "../../app/src/index";

describe("Result factories", () => {
  let Agent;
  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  // These are integration tests in the true sense, rather than end to end tests;
  // see the expect() calls in the result factory function.
  it("should be called with user's query factory and library's, & parsed request", () => {
    const queryFactory = function() { /* irrelevant stub */ } as any;

    return appPromise.then(({ subApp, Front }) => {
      subApp.get("/result-factory", Front.customAPIRequest({
        queryFactory,
        resultFactory: ({ makeQuery, request }, customQueryFactory) => {
          try {
            expect(request.queryParams.test).to.deep.equal({ 'here': "test" });
            expect(makeQuery).to.equal(API.prototype.makeQuery);
            expect(customQueryFactory).to.equal(queryFactory);
            return { status: 204 };
          } catch(e) {
            return { status: 500, headers: { 'X-Error': String(e) } };
          }
        }
      }));
    }).then(() => {
      return Agent.request("GET", "/dynamic/result-factory?test[here]=test")
        .then(response => {
          expect(response.status).to.equal(204);
        })
    });
  });

  it("should send the returned result", () => {
    const respMeta = { message: "Use different endpoint." };

    return appPromise.then(({ subApp, Front }) => {
      subApp.get("/result-factory-2", Front.customAPIRequest({
        resultFactory: ({ makeDocument }) => {
          return {
            document: makeDocument({ meta: respMeta }),
            headers: { 'Location': '/test' },
            status: 303
          };
        }
      }));
    }).then(() => {
      return Agent.request("GET", "/dynamic/result-factory-2").redirects(0)
        .then(response => {
          throw new Error("Shouldn't run. 303 rejects for some reason in superagent.");
        }, (e) => {
          expect(e.response.status).to.equal(303);
          expect(e.response.body.meta).to.deep.equal(respMeta);
          expect(e.response.headers.location).to.equal('/test');
        });
    });
  });
  /*
  app.get("/result-factory/with-query-transform", Front.customAPIRequest({
    resultFactory: ({ })
  }))*/
});

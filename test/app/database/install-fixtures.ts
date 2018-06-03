import fixtures from "./define-fixtures";

// tslint:disable-next-line no-floating-promises
fixtures.then(async (obj) => {
  return obj.fixturesReset().then(() => process.exit(0));
});

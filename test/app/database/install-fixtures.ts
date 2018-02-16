import fixtures from "./define-fixtures";

fixtures.then(obj => {
  return obj.fixturesReset().then(() => process.exit(0));
});

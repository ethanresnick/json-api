import { expect } from "chai";
import { getQueryParamValue } from "../../../src/util/query-parsing";

describe("Query Parameter Parsing", () => {
  it("should split on first equals '='", () => {
    const paramString = "filter=some=Value"
    expect(getQueryParamValue("filter",paramString).getOrDefault()).to.equal("some=Value");
  });

  it("should give empty name if '=' start of sequence", () => {
    const paramString = "=someValue"
    expect(getQueryParamValue("",paramString).getOrDefault()).to.equal("someValue");
  });

  it("should give empty value if '=' end of sequence", () => {
    const paramString = "filter="
    expect(getQueryParamValue("filter",paramString).getOrDefault()).to.equal("");
  });

  it("should make name entire sequence if no '='", () => {
    const paramString = "hello"
    expect(getQueryParamValue("hello",paramString).getOrDefault()).to.equal("");
  });

  it("should return raw value", () => {
    const paramString = "filter=he%2Cl$3Fl%4Fo"
    expect(getQueryParamValue("filter",paramString).getOrDefault()).to.equal("he%2Cl$3Fl%4Fo");
  });

  it("should decode and replace '+' with 'SP' in names for matching purpose", () => {
    const paramString = "spa+ce%5Boffset%5D=1"
    expect(getQueryParamValue("spa ce[offset]",paramString).getOrDefault()).to.equal("1");
  });
});

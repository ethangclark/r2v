import { disableWarning } from "./warningUtils";

const { warn } = console;

describe("disableWarning", () => {
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.warn = warn;
  });

  it("prevents disabled warning", () => {
    const warnMock = console.warn;
    disableWarning((str) => str === "foo");
    console.warn("foo");
    expect(warnMock).not.toHaveBeenCalled();
    console.warn("bar");
    expect(warnMock).toHaveBeenCalledWith("bar");
  });
});

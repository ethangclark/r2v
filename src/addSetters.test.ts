import { addSettersWhereNoExist } from "./addSetters";

describe("addSettersWhereNoExist", () => {
  it("adds setter where it does not exist", () => {
    const o = { a: 2 };
    const withSetters = addSettersWhereNoExist(o);
    expect(withSetters.setA).toBeInstanceOf(Function);
  });
  it("respects original setter", () => {
    const o = {
      a: 2,
      setA(v: number) {
        o.a = v * 2;
      },
    };
    const originalSetter = o.setA;
    const withSetters = addSettersWhereNoExist(o);
    expect(withSetters.setA).toBe(originalSetter);
    o.setA(2);
    expect(o.a).toBe(4);
  });
});

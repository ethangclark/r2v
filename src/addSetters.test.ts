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
  it("does not define a setter for a custom setter", () => {
    const o = {
      a: 2,
      setA(v: number) {
        o.a = v * 2;
      },
    };
    const withSetters = addSettersWhereNoExist(o);
    //@ts-expect-error
    expect(withSetters.setSetA).toBeUndefined();
  });
  it("defines a setter that throws errors for computed property", () => {
    const o = {
      a: 2,
      get doubleA() {
        return this.a * 2;
      },
    };
    const withSetters = addSettersWhereNoExist(o);
    expect(() => withSetters.setDoubleA(12321)).toThrow(
      `can't set value for computed property "doubleA" using auto-generated setter`
    );
  });
  it("respects custom setter for computed property", () => {
    const o = {
      a: 2,
      get doubleA() {
        return this.a * 2;
      },
      setDoubleA(v: number) {
        this.a = v / 2;
      },
    };
    const withSetters = addSettersWhereNoExist(o);
    withSetters.setDoubleA(6);
    expect(withSetters.a).toEqual(3);
  });
});

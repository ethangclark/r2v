import { observable, derived, reaction } from "./main";

const actionRunner = observable("actionRunner", {
  runInAction(cb: (...args: any[]) => any) {
    cb();
  },
});

test("derived values", () => {
  const state = observable("derivedPropState", {
    c: 2,
  });
  const doubleC = derived(() => state.c * 2);
  const quadrupleC = derived(() => doubleC() * 2);
  expect(doubleC()).toEqual(4);
  expect(quadrupleC()).toEqual(8);
});

test("observable + reaction + derived + derived referencing derived", () => {
  const state = observable("myObs", {
    v: 2,
    updateV(newValue: number) {
      state.v = newValue;
    },
  });
  let doubleVCalculated = 0;
  const doubleV = derived(() => {
    doubleVCalculated++;
    return state.v * 2;
  });
  let quadrupleVCalculated = 0;
  const quadrupleV = derived(() => {
    quadrupleVCalculated++;
    return doubleV() * 2;
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(doubleV());
    return doubleV();
  });
  reaction(() => {
    doubleVRunner();
  });

  const quadrupleVRunner = jest.fn(() => {
    expect(state.v * 4).toEqual(quadrupleV());
    return quadrupleV();
  });
  reaction(() => {
    quadrupleVRunner();
  });

  expect(state.v).toEqual(2);
  expect(doubleV()).toEqual(4);
  state.updateV(3);
  expect(state.v).toEqual(3);
  expect(doubleV()).toEqual(6);

  expect(doubleVRunner).toHaveBeenCalledTimes(2);
  expect(doubleVRunner).toHaveReturnedWith(4);
  expect(doubleVRunner).toHaveReturnedWith(6);
  expect(doubleVCalculated).toEqual(2);

  expect(quadrupleVRunner).toHaveBeenCalledTimes(2);
  expect(quadrupleVRunner).toHaveReturnedWith(8);
  expect(quadrupleVRunner).toHaveReturnedWith(12);
  expect(quadrupleVCalculated).toEqual(2);
});

test("auto-generated setters", () => {
  const myObs = observable("withSettersObs", {
    a: 2,
  });
  expect(myObs.a).toBe(2);
  expect(typeof myObs.setA).toBe("function");
  myObs.setA(3);
  expect(myObs.a).toBe(3);
});

test("custom setters are respected", () => {
  const myObs = observable("withCustomSetter", {
    a: 2,
    setA(v: number) {
      myObs.a = v * 2;
    },
  });
  expect(myObs.a).toEqual(2);
  myObs.setA(2);
  expect(myObs.a).toEqual(4);
});

test("setters are not generated for custom setters", () => {
  const myObs = observable("withCustomSetter2", {
    a: 2,
    setA(v: number) {
      myObs.a = v * 2;
    },
  });
  // @ts-expect-error
  expect(myObs.setSetA).toBeUndefined();
});

test("runInAction", () => {
  let doubleVCalled = 0;
  const state = observable("runInAction test obs", {
    v: 2,
    updateV(newValue: number) {
      state.v = newValue;
    },
  });
  const doubleV = derived(() => {
    doubleVCalled++;
    return state.v * 2;
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(doubleV());
    return doubleV(); // calling doubleV
  });
  reaction(() => {
    doubleVRunner();
  });

  actionRunner.runInAction(() => {
    state.setV(3);
    state.setV(4);
    state.setV(5);
  });

  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(doubleV()).toEqual(10);
  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(doubleVCalled).toEqual(2);
});

test("`this` pattern works", () => {
  const state = observable("thisPatternObs", {
    c: 2,
    doubleC() {
      return state.c * 2;
    },
  });
  expect(state.doubleC()).toEqual(4);
});
test("self-reference pattern works", () => {
  const state = observable("selfRefPatternObs", {
    c: 2,
    doubleC() {
      return state.c * 2;
    },
  });
  expect(state.doubleC()).toEqual(4);
});

test("box pattern", () => {
  // // inherently broken
  // const state = observable("boxState", {
  //   _z: (() => 123) as () => number,
  //   get z() {
  //     return state._z();
  //   },
  //   set z(v: number) {
  //     state._z = () => v;
  //   },
  // });
  const state = observable("boxState", {
    _z: (() => 123) as () => number,
    z() {
      return state._z();
    },
    setZ(v: number) {
      state._z = () => v;
    },
  });
  expect(state.z()).toEqual(123);
  state.setZ(321);
  expect(state.z()).toEqual(321);
});

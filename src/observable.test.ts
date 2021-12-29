import { observable, runInAction, reactively, disableWarnings } from "./main";

disableWarnings();

test("computed prop", () => {
  const state = observable("computedPropState", {
    c: 2,
    doubleC() {
      return state.c * 2;
    },
  });
  expect(state.doubleC()).toEqual(4);
});

test("observable + reactively", () => {
  const state = observable("myObs", {
    v: 2,
    updateV(newValue: number) {
      state.v = newValue;
    },
    doubleV() {
      return state.v * 2;
    },
    quadrupleV() {
      return state.doubleV() * 2;
    },
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(state.doubleV());
    return state.doubleV();
  });
  reactively(doubleVRunner);

  const quadrupleVRunner = jest.fn(() => {
    expect(state.v * 4).toEqual(state.quadrupleV());
    return state.quadrupleV();
  });
  reactively(quadrupleVRunner);

  expect(state.v).toEqual(2);
  expect(state.doubleV()).toEqual(4);
  state.updateV(3);
  expect(state.v).toEqual(3);
  expect(state.doubleV()).toEqual(6);

  expect(doubleVRunner).toHaveBeenCalledTimes(2);
  expect(doubleVRunner).toHaveReturnedWith(4);
  expect(doubleVRunner).toHaveReturnedWith(6);

  expect(quadrupleVRunner).toHaveBeenCalledTimes(2);
  expect(quadrupleVRunner).toHaveReturnedWith(8);
  expect(quadrupleVRunner).toHaveReturnedWith(12);
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
    doubleV() {
      doubleVCalled++;
      return state.v * 2;
    },
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(state.doubleV());
    return state.doubleV(); // calling doubleV
  });
  reactively(doubleVRunner);

  runInAction(() => {
    state.setV(3);
    state.setV(4);
    state.setV(5);
  });

  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(state.doubleV()).toEqual(10);
  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(doubleVCalled).toEqual(2);
});

test("`this` pattern works", () => {
  const state = observable("thisPatternObs", {
    c: 2,
    doubleC() {
      return this.c * 2;
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

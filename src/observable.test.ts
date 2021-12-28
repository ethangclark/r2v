import { autorun } from "mobx";
import { observable, runInAction } from "./main";

test("observable + autorun", () => {
  const state = observable("myObs", {
    v: 2,
    updateV(newValue: number) {
      state.v = newValue;
    },
    get doubleV() {
      return this.v * 2;
    },
    get quadrupleV() {
      return this.doubleV * 2;
    },
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(state.doubleV);
    return state.doubleV;
  });
  autorun(doubleVRunner);

  const quadrupleVRunner = jest.fn(() => {
    expect(state.v * 4).toEqual(state.quadrupleV);
    return state.quadrupleV;
  });
  autorun(quadrupleVRunner);

  expect(state.v).toEqual(2);
  expect(state.doubleV).toEqual(4);
  state.updateV(3);
  expect(state.v).toEqual(3);
  expect(state.doubleV).toEqual(6);

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
      this.a = v * 2;
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
      this.a = v * 2;
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
    get doubleV() {
      doubleVCalled++;
      return this.v * 2;
    },
  });

  const doubleVRunner = jest.fn(() => {
    expect(state.v * 2).toEqual(state.doubleV);
    return state.doubleV; // calling doubleV
  });
  autorun(doubleVRunner);

  runInAction(() => {
    state.setV(3);
    state.setV(4);
    state.setV(5);
  });

  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(state.doubleV).toEqual(10);
  expect(doubleVRunner).toHaveBeenCalledTimes(2); // initial, and then after action
  expect(doubleVCalled).toEqual(2);
});

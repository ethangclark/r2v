import React from "react";
import { State, Reaction, View } from "./main";
import { render } from "react-dom";

const state1 = State("state1", {
  a: 2,
  breakerEnabled: false as boolean,
  break() {
    throw new Error("Yolo!");
  },
});
const state2 = State("state2", {
  b: 3,
  c: 4,
  double() {
    state2.b = state2.b * 2;
  },
  quadruple() {
    state2.double();
    state2.double();
  },
  doubleB() {
    return state2.b * 2;
  },
});

const anonState = State({
  d: 5,
});

Reaction(() => {
  console.log("a/b:", state1.a, state2.b);
});

state1.setA(123);
state2.setB(456);

const InternalComponentTest = View(() => {
  console.log("internal is rendering...");
  return (
    <div onClick={() => anonState.setD(anonState.d + 1)}>
      Hello from internal component. {anonState.d}
    </div>
  );
});

const MyComponent = View(() => {
  console.log("Outer is rendering.");
  return (
    <div>
      Hello
      <div onClick={() => state1.setA(state1.a + 1)}>{state1.a}</div>
      <div onClick={() => state2.setB(state2.b + 2)}>{state2.b}</div>
      <div onClick={() => state2.double()}>double: {state2.doubleB()}</div>
      <div onClick={() => state2.quadruple()}>quadruple</div>
      <InternalComponentTest />
      <div onClick={() => state1.a++}>Complainer...</div>
      <div onClick={() => state1.setBreakerEnabled(true)}>Breaker...</div>
      {state1.breakerEnabled && state1.break()}
    </div>
  );
});

window.onload = () => {
  render(<MyComponent />, document.getElementById("root"));
};

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).foo = foo  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

// console.log('Method "foo" was added to the window object. You can try it yourself by just entering "await foo()"')

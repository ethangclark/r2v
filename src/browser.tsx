import React from "react";
import { observable, reactively, observer } from "./main";
import { render } from "react-dom";

const obs1 = observable("obs1", {
  a: 2,
});
const obs2 = observable("obs2", {
  b: 3,
  doubleB() {
    obs2.b = obs2.b * 2;
  },
});
(window as any).obs2 = obs2;

reactively(() => {
  console.log("a/b:", obs1.a, obs2.b);
});

obs1.a = 123;
obs2.b = 456;

const state = observable("myObservable", {
  count: 1,
});
const MyView1 = observer(() => (
  <div onClick={() => state.count++}>{state.count}</div>
));
const MyView2 = observer(() => (
  <div onClick={() => (state.count = state.count + 1)}>{state.count}</div>
));
const MyView3 = observer(() => (
  <div onClick={() => (state.count = Math.random())}>{state.count}</div>
));
const Doubler = observer(() => (
  <div onClick={() => (state.count = state.count * 2)}>
    double: {obs2.doubleB()}
  </div>
));

const MyComponent = observer(() => (
  <div>
    Hello
    <div onClick={() => (obs1.a = obs1.a + 1)}>{obs1.a}</div>
    <div onClick={() => (obs2.b = obs2.b + 2)}>{obs2.b}</div>
    <MyView1 />
    <MyView2 />
    <MyView3 />
    <Doubler />
  </div>
));

window.onload = () => {
  render(<MyComponent />, document.getElementById("root"));
};

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).foo = foo  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

// console.log('Method "foo" was added to the window object. You can try it yourself by just entering "await foo()"')

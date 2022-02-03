import React from "react";
import { observable, reaction, observer } from "./main";
import { render } from "react-dom";

const obs1 = observable("obs1", {
  a: 2,
});
const obs2 = observable("obs2", {
  b: 3,
  c: 4,
  double() {
    obs2.b = obs2.b * 2;
  },
  quadruple() {
    obs2.double();
    obs2.double();
  },
  doubleB() {
    return obs2.b * 2;
  },
});

reaction(() => {
  console.log("a/b:", obs1.a, obs2.b);
});

obs1.setA(123);
obs2.setB(456);

const InternalComponentTest = observer(() => {
  console.log("internal is rendering...");
  return (
    <div onClick={() => obs2.setC(obs2.c + 1)}>
      Hello from internal component. {obs2.c}
    </div>
  );
});

const MyComponent = observer(() => {
  console.log("Outer is rendering.");
  return (
    <div>
      Hello
      <div onClick={() => obs1.setA(obs1.a + 1)}>{obs1.a}</div>
      <div onClick={() => obs2.setB(obs2.b + 2)}>{obs2.b}</div>
      <div onClick={() => obs2.double()}>double: {obs2.doubleB()}</div>
      <div onClick={() => obs2.quadruple()}>quadruple</div>
      <InternalComponentTest />
    </div>
  );
});

window.onload = () => {
  render(<MyComponent />, document.getElementById("root"));
};

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).foo = foo  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

// console.log('Method "foo" was added to the window object. You can try it yourself by just entering "await foo()"')

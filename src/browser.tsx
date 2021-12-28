import React from "react";
import { render } from "react-dom";
import { observable, autorun, observer } from "./main";

const obs1 = observable("obs1", {
  a: 2,
});
const obs2 = observable("obs2", {
  b: 3,
});

autorun(() => {
  console.log("a/b:", obs1.a, obs2.b);
});

obs1.setA(123);
obs1.setA(123);
obs2.setB(124);

const MyComponent = observer(() => (
  <div>
    Hello
    <div onClick={() => obs1.setA(obs1.a + 1)}>{obs1.a}</div>
    <div onClick={() => obs2.setB(obs2.b + 2)}>{obs2.b}</div>
  </div>
));

window.onload = () => {
  render(<MyComponent />, document.getElementById("root"));
};

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).foo = foo  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

// console.log('Method "foo" was added to the window object. You can try it yourself by just entering "await foo()"')

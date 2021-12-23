/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import { observable, autorun } from "./main";

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
obs2.setB(1515);

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).foo = foo  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

// console.log('Method "foo" was added to the window object. You can try it yourself by just entering "await foo()"')

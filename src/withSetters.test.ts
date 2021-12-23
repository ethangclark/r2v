import { observable } from "./main";
import { withSetters } from "./withSetters";

test("withSetters", () => {
  const myObs = observable(
    "withSettersObs",
    withSetters({
      a: 2,
    })
  );
  expect(myObs.a).toBe(2);
  expect(typeof myObs.setA).toBe("function");
  myObs.setA(3);
  expect(myObs.a).toBe(3);
});

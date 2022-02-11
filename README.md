# rvu

## Vue for React

rvu is a state management solution for React.

### Example

```tsx
import { State, View } from 'rvu'

/*
When IncrementButton is clicked, CountDisplay will update automatically.
No hooks, props, or context required!
*/

const state = State({
  count: 0,
  increment() {
    state.setCount(state.count + 1)
  },
})
const CountDisplay = View(() => (
  <div className="myFancyClassName">{state.count}</div>
))
const IncrementButton = View(() => (
  <button onClick={state.increment}>increment</button>
))
const MyComponent = View(() => (
  <div>
    <CountDisplay />
    <IncrementButton />
  </div>
))
```

Instead of defining state in hooks and passing it around with props or context, rvu lets you define `State` state objects you can reference from any `View`. Whenever a `State` field or subfield updates, only `View`s that read from that particular field or subfield update.

rvu is fundamentally different from most state-management solutions, so it's recommended that you read the entire README before using rvu.

## Core API

### View

A React function component wrapped in `View()` will update whenever any `State` field (or subfield) it references in its *synchronous evaluation* updates.

### State

`State`s are objects for storing and updating application state. They work like this:

```tsx
const state = State({
  users: [] as Array<User>,

  setUserName(userId: string, newName: string) {
    const user = state.users.find(u => u.id === userId)
    if (user) {
      // direct object mutations are allowed in synchronous methods :)
      user.fullName = newName
    } else {
      throw Error('no user with that ID is loaded')
    }
  },

  async fetchUsers(userIds) {
    const users = await fetch(...)

    // Setters like `setUsers` are created automatically for non-function fields.
    // They are also included in the resultant object's TypeScript type the object, so this is completely type-safe.
    // (Executing `state.users = users` would not be allowed here, because this method is not asynchronous)
    state.setUsers(users)
  },
})

export const UserTable = View(() => (
  <div>
    <div>Total users: ${state.users.length}</div>
   <table>
      { state.users.map(user => (
        <tr key={user.id}>
          <td>{user.id}</td>
          <td>{user.fullName}</td>
        </tr>
      ))}
    </table>
    <button onClick={() => state.fetchUsers(state.users.map(u => u.id))}>
      Refresh
    </button>
  </div>
))
```

#### Methods

Functions included in state definitions are automatically transformed into methods.

Methods have 3 defining features:

1. They are the ONLY way to modify state
2. They are ONLY allowed to modify state if they are synchronous
3. They also provide the functionality of `Materialization` functions (described below)

Every time you call an method that updates state, rvu triggers rerenders on all `View`s that reference any updated fields/subfields.

Methods (like `fetchUsers()`) are free to read from and modify state on any state.

One important thing to note: methods may call other methods, and `State`s will not update until the outermost method has finished being (synchronously) executed. So: this will cause 2 renders: `myObs.setFirstName('Ethan'); myObs.setLastName('Clark');`, but this method will only cause 1 render (even though it calls two other methods): `myObs.setNames(first: string, last: string) { state.setFirstName(first); state.setLastName(last) }`

If you want a generic way to execute several methods together ad-hoc, without having to create higher-level methods, you could create an method runner:

```tsx
const methodRunner = State("methodRunner", {
  runAsMethod(cb: (...args: any[]) => any) {
    cb();
  },
});
```

and use it like so:

```tsx
methodRunner.runAsMethod(() => {
  someObs.someMethod()
  someObs.someOtherMethod()
})
```

If you change a function on an state, it will no longer function as a method after it's been changed, and so it won't be allowed to update state. (If this is a problem for your use case, create an issue and we can assess whether we want to add support for this ability.) A valid use-case for changing a function is if you want to prevent something being transformed into an state (say, a particularly massive object) for performance reasons, but still want Reactions to occur when the _reference_ to that object change. Here's an example:

```tsx
const state = State('boxExample', {
  giantObjectBox: () => someGiantObject,
  getGiantObject() {
    return this.giantObjectBox()
  },
  setGiantObject(newGiantObject: GiantObjectType) {
    this.giantObjectBox = () => newGiantObject
  },
})
```
Here, `View`s and `Reactions` will update when the giant object is set to a new value, but won't update to changes on subfields of the giant object. Since turning an object into an state has a computational expense, this may be desirable in some cases.

#### Setters

Setters are methods that rvu auto-generates for you. They are automatically generated for all non-function fields. So, if you define `const myObs = View('myViewName', { abc: 123 })`, `myObs.setAbc` will be automatically defined and always-available.

If you define your own setter methods, rvu will respect the method you define, and will not override it. If for some reason you want to prevent a setter from being generated, define it as `null`, like so:

```tsx
const state = State({
  x: 2,
  setX: null,
})
```

If you define the setter as `null`, rvu will leave it as such. Doing so will also set the type of `setX` to `null & Function`, which means that TypeScript will yell at you if you try to use it, as that value doesn't make sense from a type perspective.

#### IMPORTANT

You must ONLY pull values out of states from WITHIN Views and Reactions for the Views and Reactions to update when the states update.

So this will work:
```tsx
const clickCounts = State('myObs', {
  clicks: 0
})
const ClickCounter = View(() => (
  <div onClick={() => myObs.setClicks(myObs.clicks + 1)}>{myObs.clicks}</div>
))
```

And this will not work:
```tsx
const clickCounts = State('myObs', {
  clicks: 0
})
const { clicks, setClicks } = clickCounts
const ClickCounter = View(() => (
  <div onClick={() => setClicks(clicks + 1)}>{clicks}</div>
))
```

For a big breakdown of this idea, [see here](https://mobx.js.org/understanding-reactivity.html)

### Materialization

`Materialization` functions cache Materialization state, allowing you to avoid expensive recalculations. They work like this:

```tsx
// rvu stores the result of this after it's called once,
// and only ever recalculates it if `state.users` changes,
// which makes it very efficient
const activeUsers = Materialization(() => {
  // (`state` is an state object)
  return state.users.filter(u => !u.deactivated)
}),

// the result of calls to this method will be cached by `id`, automatically,
// updating the same as the above case
const user = Materialization((id: string | number | whatever) => {
  // (`state` is an state object)
  return state.users.find(u => u.id === id) || null
})
```

`Materialization` function results behave the same as `state` state fields, so this component will always display the `user`'s latest field values, even after those values change:

```tsx
// the logic inside the definition passed to `Materialization` above will only execute once in the rendering of this,
// and will only execute once when either `userId` changes or that user's `fullName` or `id` changes.
const User = View(() => (<div>User ${user(userId).fullName} (id: ${user(userId).id})</div>))
```

`Materialization` functions are free to reference both obervable state and other Materialization state. So this is a valid `Materialization` function:

```tsx
const userFullName = Materialization((id: string | number | whatever) => user(id)?.fullName)
```

As mentioned above, all fields on `View`s also function as `Materialization` functions. So in the following example, `userState.fullName` provides identical functionality to `userFullName` above:

```tsx
const userState = View('userState', {
  fullName(id: string | number | whatever) {
    return user(id)?.fullName
  }
})
```

#### IMPORTANT

Do not use `try/catch` within a `Materialization` function. Errors here can break `Views` and `Reaction`s. (Due to the nature of JavaScript, there's no way to keep stack traces sane while still allowing some Reactions to work while others have broken.)

For this reason, TypeScript's "strict" mode is deeply, _deeply_ encouraged.

#### IMPORTANT

The same rule about state state holds with Materialization state: you must ONLY call `Materialization` functions from WITHIN Views and Reactions for the Views and Reactions to update when Materialization state updates.

## Special use-case API

These exports allow for interoperability with other frameworks.

### Reaction

#### API: Reaction(def: () => (void | (nonReactiveFollowup: () => void))): function stop(): void

If you want to "push" values from an View into something else as they update, you can use `Reaction` to do so.

Every time any value referenced in a `Reaction` updates, `Reaction` will rerun.

Your `Reaction` definition may return a function, if you wish. This function will be called immediatley after the `Reaction` completes, and any `state` values referenced by this function will not trigger `Reaction` re-runs when they change.

Creating a `Reaction` returns a `stop()` function, which can be called to stop the Reaction from running.

## Logging

rvu logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), if available.

## Comparison with MobX

rvu condenses all of the power of MobX's massive API (> 100 exports) into a tiny, opinionated API (3 "core" exports + 2 "special use-case" exports). It requires no prior knowledge of MobX. That being said, if you do want to use it with Mobx, rvu `State` objets are valid Mobx `observable`s.

## gotchas

### dereferencing `State` or `Materialization` fields outside of `View`s or `Reaction`s

This is mentioned above, but worth repeating: if you pull fields off of an `state` _outside_ of an `View` or `Reaction`, and then use those fields _inside_ an `View` or `Reaction`, the `View/Reaction` *will not update* when those fields change on the `state`. You should *only* dereference fields you want to "listen" to *inside* of `View`s or `Reaction`s.

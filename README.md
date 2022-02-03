# `mx2`

mx2 is a state-management solution for TypeScript + React. It is a replacement for ~90% of component props, hooks, and context.

Instead of wrapping state in hooks and passing it around via props or context, `mx2` lets you define standalone `observable` state objects, which can be referenced from any React function wrapped in `observer`. Whenever any `observable` field or subfield updates, only those `observer` components that read from that particular field or subfield update.

`mx2` is a fundamentally different programming model than most state-management solutions, so it's recommended that you read the entire README before using `mx2`.

## Logging

mx2 logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), if available.

## Comparison with MobX

mx2 condenses all of the power of MobX's massive API (> 100 exports) into a tiny, opinionated API (3 "core" exports + 2 "special use-case" exports). It requires no prior knowledge of MobX.

## Core API

### observer

A React function component wrapped in `observer()` will update whenever any `observable` field (or subfield) it references updates.

### observable

`observable`s are objects for storing and updating application state. They work like this:

```tsx
// the first argument is the name of this state as it will appear in Redux devtools, if you're using them
const state = observable('userState', {

  users: [] as Array<User>,

  async fetchUsers(userIds) {
    const users = await fetch(...)

    // Setters like `setUsers` are created automatically for non-function fields.
    // State must be modified via synchronous methods; since `await` was called above, the
    // method is no longer running, so another method (`setUsers`) must be called
    state.setUsers(users)
  },

  // this is an `method`
  setUserName(userId: string | number | whatever, newName: string) {
    const user = state.users.find(u => u.id === userId)
    if (user) {
      user.fullName = newName // mutate the object directly
    } else {
      throw Error('no user with that ID is loaded')
    }
  },

})

export const UserTable = observer(() => (
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

Functions included in observable definitions are automatically transformed into methods.

Methods have 3 defining features:

1. They are the ONLY way to modify state
2. Their state modifications MUST be synchronous. (It's fine if they trigger an asynchronous process, but they may not update state after `await`ing anything or in a callback.)
3. They also provide the functionality of `derived` functions (described below)

Every time you call an method that updates state, mx2 triggers rerenders on all `observer`s that reference any updated fields/subfields.

Methods (like `fetchUsers()`) are free to read from and modify state on any observable.

One important thing to note: methods may call other methods, and `observable`s will not update until the outermost method has finished being (synchronously) executed. So: this will cause 2 renders: `myObs.setFirstName('Ethan'); myObs.setLastName('Clark');`, but this method will only cause 1 render (even though it calls two other methods): `myObs.setNames(first: string, last: string) { state.setFirstName(first); state.setLastName(last) }`

If you want a generic way to execute several methods together ad-hoc, without having to create higher-level methods, you could create an method runner:

```tsx
const methodRunner = observable("methodRunner", {
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

If you change a function on an observable, it will no longer function as a method after it's been changed, and so it won't be allowed to update state. (If this is a problem for your use case, create an issue and we can assess whether we want to add support for this ability.) A valid use-case for changing a function is if you want to prevent something being transformed into an observable (say, a particularly massive object) for performance reasons, but still want reactions to occur when the _reference_ to that object change. Here's an example:

```tsx
const state = observable('boxExample', {
  giantObjectBox: () => someGiantObject,
  getGiantObject() {
    return this.giantObjectBox()
  },
  setGiantObject(newGiantObject: GiantObjectType) {
    this.giantObjectBox = () => newGiantObject
  },
})
```
Here, `observer`s and `reactions` will update when the giant object is set to a new value, but won't update to changes on subfields of the giant object. Since turning an object into an observable has a computational expense, this may be desirable in some cases.

#### Setters

Setters are methods that mx2 auto-generates for you. They are automatically generated for all non-function fields. So, if you define `const myObs = observer('myObserverName', { abc: 123 })`, `myObs.setAbc` will be automatically defined and always-available.

If you define your own setter methods, mx2 will respect the method you define, and will not override it. If for some reason you want to prevent a setter from being generated, define it as `null`, like so:

```tsx
const state = observable({
  x: 2,
  setX: null,
})
```

If you define the setter as `null`, mx2 will leave it as such. Doing so will also set the type of `setX` to `null & Function`, which means that TypeScript will yell at you if you try to use it, as that value doesn't make sense from a type perspective.

#### IMPORTANT

You must ONLY pull values out of observables from WITHIN observers and reactions for the observers and reactions to update when the observables update.

So this will work:
```tsx
const clickCounts = observable('myObs', {
  clicks: 0
})
const ClickCounter = observer(() => (
  <div onClick={() => myObs.setClicks(myObs.clicks + 1)}>{myObs.clicks}</div>
))
```

And this will not work:
```tsx
const clickCounts = observable('myObs', {
  clicks: 0
})
const { clicks, setClicks } = clickCounts
const ClickCounter = observer(() => (
  <div onClick={() => setClicks(clicks + 1)}>{clicks}</div>
))
```

For a big breakdown of this idea, [see here](https://mobx.js.org/understanding-reactivity.html)

### derived

`derived` functions cache derived state, allowing you to avoid expensive recalculations. They work like this:

```tsx
// mx2 stores the result of this after it's called once,
// and only ever recalculates it if `state.users` changes,
// which makes it very efficient
const activeUsers = derived(() => {
  // (`state` is an observable object)
  return state.users.filter(u => !u.deactivated)
}),

// the result of calls to this method will be cached by `id`, automatically,
// updating the same as the above case
const user = derived((id: string | number | whatever) => {
  // (`state` is an observable object)
  return state.users.find(u => u.id === id) || null
})
```

`derived` function results behave the same as `observable` state fields, so this component will always display the `user`'s latest field values, even after those values change:

```tsx
// the logic inside the definition passed to `derived` above will only execute once in the rendering of this,
// and will only execute once when either `userId` changes or that user's `fullName` or `id` changes.
const User = observer(() => (<div>User ${user(userId).fullName} (id: ${user(userId).id})</div>))
```

`derived` functions are free to reference both obervable state and other derived state. So this is a valid `derived` function:

```tsx
const userFullName = derived((id: string | number | whatever) => user(id)?.fullName)
```

As mentioned above, all fields on `observer`s also function as `derived` functions. So in the following example, `userState.fullName` provides identical functionality to `userFullName` above:

```tsx
const userState = observer('userState', {
  fullName(id: string | number | whatever) {
    return user(id)?.fullName
  }
})
```

#### IMPORTANT

Do not use `try/catch` within a `derived` function. Errors here can break `observers` and `reaction`s. (Due to the nature of JavaScript, there's no way to keep stack traces sane while still allowing some reactions to work while others have broken.)

For this reason, TypeScript's "strict" mode is deeply, _deeply_ encouraged.

#### IMPORTANT

The same rule about observable state holds with derived state: you must ONLY call `derived` functions from WITHIN observers and reactions for the observers and reactions to update when derived state updates.

## Special use-case API

These exports allow for interoperability with other frameworks.

### reacttion

#### API: reacttion(def: () => (void | (nonReactiveFollowup: () => void))): function stop(): void

If you want to "push" values from an observer into something else as they update, you can use `reacttion` to do so.

Every time any value referenced in a `reacttion` updates, `reacttion` will rerun.

Your `reacttion` definition may return a function, if you wish. This function will be called immediatley after the `reacttion` completes, and any `observable` values referenced by this function will not trigger `reacttion` re-runs when they change.

Creating a `reacttion` returns a `stop()` function, which can be called to stop the reacttion from running.

### mobx

While it is not recommended, if you wish to use mx2's version of mobx directly, you may via `import { mobx } from 'mx2'`

## gotchas

### dereferencing `observable` or `derived` fields outside of `observer`s or `reacttion`s

This is mentioned above, but worth repeating: if you pull fields off of an `observable` _outside_ of an `observer` or `reacttion`, and then use those fields _inside_ an `observer` or `reacttion`, the `observer/reacttion` *will not update* when those fields change on the `observable`. You should *only* dereference fields you want to "listen" to *inside* of `observer`s or `reacttion`s.

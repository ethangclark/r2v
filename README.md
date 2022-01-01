# `better-mobx`

better-mobx is a state-management solution for TypeScript + React. It allows you to define `observable` state, which can be referenced from any React function component wrapped in `observable`. Whenever any `observable` field or subfield updates, only those `observable` components that read from that particular field or subfield update.

`better-mobx` is a fundamentally different programming model than most state-management solutions, so it's recommended that you read the entire README before using `better-mobx`.

## Logging

better-mobx logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), if available.

## Comparison with MobX

better-mobx condenses all of the power of MobX's massive API (> 100 exports) into a tiny, opinionated API (3 "core" exports + 2 "special use-case" exports). It requires no prior knowledge of MobX.

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
    // State must be modified via synchronous actions; since `await` was called above, the
    // action is no longer running, so another action (`setUsers`) must be called
    state.setUsers(users)
  },

  // this is an `action`
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

#### Actions

Functions included in observable definitions are automatically transformed into actions.

Actions have 2 defining features: they are the ONLY way to modify state, and they MUST be synchronous. Every time you call an action that updates state, better-mobx triggers rerenders on all `observer`s that reference any updated fields/subfields.

Actions (like `fetchUsers()`) are free to read from and modify state on any observable.

One important thing to note: actions may call other actions, and `observable`s will not update until the outermost action has finished being (synchronously) executed. So: this will cause 2 renders: `myObs.setFirstName('Ethan'); myObs.setLastName('Clark');`, but this action will only cause 1 render (even though it calls two other actions): `myObs.setNames(first: string, last: string) { state.setFirstName(first); state.setLastName(last) }`

If you want a generic way to execute several actions together ad-hoc, without having to create higher-level actions, you could create an action runner:

```tsx
const actionRunner = observable("actionRunner", {
  runInAction(cb: (...args: any[]) => any) {
    cb();
  },
});
```

and use it like so:

```tsx
actionRunner.runInAction(() => {
  someObs.someAction()
  someObs.someOtherAction()
})
```

#### Setters

Setters are actions that better-mobx auto-generates for you. They are automatically generated for all non-function fields. So, if you define `const myObs = observer('myObserverName', { abc: 123 })`, `myObs.setAbc` will be automatically defined and always-available.

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
// better-mobx stores the result of this after it's called once,
// and only ever recalculates it if `state.users` changes,
// which makes it very efficient
const activeUsers = derived(() => {
  // (`state` is an observable object)
  return state.users.filter(u => !u.deactivated)
}),

// the result of calls to this action will be cached by `id`, automatically,
// updating the same as the above case
const user = derived((id: string | number | whatever) => {
  // (`state` is an observable object)
  return state.users.find(u => u.id === id) || null
})
```

`derived` function results behave the same as `observable` state fields, so this component will always display the `user`'s latest field values, even after those values change:

```tsx
// the logic inside the definitino passed to `derived` above will only execute once in the rendering of this,
// and will only execute once when either `userId` changes or that user's `fullName` or `id` changes.
const User = observer(() => (<div>User ${user(userId).fullName} (id: ${user(userId).id})</div>))
```

Derived state is free to reference both obervable state and other derived state. So this is a valid use of derived state:

```tsx
const userFullName = derived((id: string | number | whatever) => user(id)?.fullName)
```

#### IMPORTANT

Do not use `try/catch` within derived state. Errors here can break `observers` and `reaction`s. (Due to the nature of JavaScript, there's no way to keep stack traces sane while still allowing some reactions to work while others have broken.)

For this reason, TypeScript's "strict" mode is deeply, _deeply_ encouraged.

#### IMPORTANT

The same rule about observable state holds with derived state: you must ONLY call derived state functions from WITHIN observers and reactions for the observers and reactions to update when derived state updates.

## Special use-case API

These exports allow for interoperability with other frameworks.

### reaction

#### API: reaction(def: () => (void | (nonReactiveFollowup: () => void))): function stop(): void

If you want to "push" values from an observer into something else as they update, you can use `reaction` to do so.

Every time any value referenced in a `reaction` updates, `reaction` will rerun.

Your `reaction` definition may return a function, if you wish. This function will be called immediatley after the `reaction` completes, and any `observable` values referenced by this function will not trigger `reaction` re-runs when they change.

Creating a `reaction` returns a `stop()` function, which can be called to stop the reaction from running.

### mobx

While it is not recommended, if you wish to use better-mobx's version of mobx directly, you may via `import { mobx } from 'better-mobx'`

## gotchas

### dereferencing `observable` or `derived` fields outside of `observer`s or `reaction`s

This is mentioned above, but worth repeating: if you pull fields off of an `observable` _outside_ of an `observer` or `reaction`, and then use those fields _inside_ an `observer` or `reaction`, the `observer/reaction` *will not update* when those fields change on the `observable`. You should *only* dereference fields you want to "listen" to *inside* of `observer`s or `reaction`s.

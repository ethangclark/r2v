# `better-mobx`

better-mobx is a state-management solution for TypeScript + React. It allows you to define `observable` and `derived` state objects, which can be referenced from any React function component wrapped in `observable`. Whenever any field or subfield on an `observable` or `derived` state object updates, only those `observable` components that read from that particular field or subfield update.

`better-mobx` is a fundamentally different programming model than most state-management solutions, so it's recommended that you read the entire README before using `better-mobx`.

## Logging

better-mobx logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), if available.

## Comparison with MobX

better-mobx condenses all of the power of MobX's massive API (> 100 exports) into a tiny, opinionated API (4 core exports, plus 1 "extended" export). It requires no prior knowledge of MobX.

## API

### observer

A React function component wrapped in `observer()` will update whenever any `observable` or `derived` field (or subfield) it references updates.

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

Actions are what you use to update state. They have 2 defining features: they are what you MUST use to modify state, and they MUST be synchronous. Every time you call an action that updates state, better-mobx triggers rerenders on all `observer`s that reference any updated fields/subfields, and reruns all `reaction`s (explained below) that reference those fields/subfields as well.

Actions (like `fetchUsers()`) are free to read from and modify state on other observables.

One important thing to note: actions may call other actions, and no rerender/reaction will occur until the outermost action being executed as completed. So: this will cause 2 renders: `myObs.setFirstName('Ethan'); myObs.setLastName('Clark');`

This action, when called, only causes 1 render, even though it itself calls two other actions: `myObs.setNames(first: string, last: string) { state.setFirstName(first); state.setLastName(last) }`

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

`derived` state objects represent derived state. They work like this:

```tsx
const derived = derived({

  // better-mobx stores the result of this after it's called once,
  // and only ever recalculates it if `state.users` changes,
  // which makes it very efficient
  activeUsers() {
    return state.users.filter(u => !u.deactivated)
  },

  // the result of calls to this action will be cached by `id`, automatically,
  // updating the same as the above case
  user(id: string | number | whatever) {
    return state.users.find(u => u.id === id) || null
  },
})
```

You can reference fields on `derived` state the same as fields on `observable` state, and they behave the same; when a `derived` value changes, the `observable` (or `reaction`) automatically updates.

It's worth noting that derived state is free to reference state and derived state on other observables.

#### IMPORTANT

Do not use `try/catch` within derived state. Errors here can break `observers` and `reaction`s. (Due to the nature of JavaScript, there's no way to keep stack traces sane while still allowing some reactions to work while others have broken.)

For this reason, TypeScript's "strict" mode is deeply, _deeply_ encouraged.

### reaction

#### API: reaction(def: () => void | (() => void)): function stop(): void

If you want to "push" values from an observer into something else as they update, you can use `reaction` to do so.

Every time any value referenced in `reaction` updates, `reaction` will rerun. If you want to pull values out of your observables without making your reaction rerun every time there's a change of value, you can do that in `andThen`. If you are using `andThen` and your `reaction` returns a value, that value will be passed to `andThen` so that you don't have to recalculate the value.

Call `stop()` if you want the reaction to stop running.

## Extended API

### mobx

While it is not recommended, if you wish to use better-mobx's version of mobx directly, you may via `import { mobx } from 'better-mobx'`

## performance tips

better-mobx transforms all of your objects into proxies to allow it to track which observers are listening to which observables. This can be expensive with massive objects.

If you don't want a whole object to be tracked for performance reasons, wrap it in a function, like so:

```tsx
const myObs = observable('myObserver', {

  getMyGiantField: () => null,

  // you must define the getter yourself, as setters aren't auto-defined for functions
  setGetMyGaintField(value) {
    myObs.getMyGiantField = () => value
  }
})
const MyView = observer(() => (
  <div>{myObs.getMyGiantField().whateverSubfieldYouWant}</div>
))
```

## gotchas

### dereferencing `observable` or `derived` fields outside of `observer`s or `reaction`s

This is mentioned above, but worth repeating: if you pull fields off of an `observable` _outside_ of an `observer` or `reaction`, and then use those fields _inside_ an `observer` or `reaction`, the `observer/reaction` *will not update* when those fields change on the `observable`. You should *only* dereference fields you want to "listen" to *inside* of `observer`s or `reaction`s.

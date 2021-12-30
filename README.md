# `better-mobx`

better-mobx is a state-management solution for TypeScript + React. It allows you to define your state as `observer`s, which can be referenced from any React function component wrapped in `observable`. Whenever any field or subfield on an `observer` updates, only those `observable` components that read from that particular field or subfield update.

## Logging

better-mobx logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), if available.

## Comparison with MobX

better-mobx condenses all of the power of MobX into a tiny, opinionated API. It requires no prior knowledge of MobX, but all better-mobx objects are valid MobX objects as well, so you can use them together if you like.

## API

### observer

A React function component wrapped in `observer()` will update whenever any `observable` field (or subfield) it references updates.

### observable

`observable`s are objects for storing and updating application state. They work like this:

```tsx
const state = observable('userState', {

  users: [] as Array<User>,

  // better-mobx stores the result of this after it's called once,
  // and only ever recomputes it if `this.users` changes,
  // which makes it very efficient
  activeUsers() {
    return this.users.filter(u => !u.deactivated)
  },

  // the result of calls to this method will be cached by `id`, automatically,
  // updating the same as the above case
  user(id: string | number | whatever) {
    return this.users.find(u => u.id === id) || null
  }

  async fetchUsers(userIds) {
    const users = await fetch(...)
    this.setUsers(users) // setters are created automatically
  }

})

export const UserTable = observer(() => (
  <div>
    <div>Total users: ${state.users.length}</div>
   <table>
      { state.activeUsers().map(user => (
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

`observable`s support "computed state", which is shown by `activeUsers()` above. "Computed state" only recomputes when fields it is derived from update.

It's worth noting that computed state is free to reference state and computed state on other observables, and methods (like `fetchUsers()`) are free to read from and modify state on other observables.

#### IMPORTANT
All observable fields should only be modified via `setters`, which are auto-generated (like `setUsers()` above).

#### IMPORTANT
You must ONLY pull values out of observables from WITHIN observers for the observers to be able to update when the observables update.

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

### reactively

#### API: reactively(reaction: () => X, andThen?: (X) => void): function stop(): void

If you want to "push" values from an observer into something else as they update, you can use `reactively` to do so.

Every time any value referenced in `reaction` updates, `reaction` will rerun. If you want to pull values out of your observables without making your function rerun every time there's a change of value, you can do that in `andThen`. If you are using `andThen` and your `reaction` returns a value, that value will be passed to `andThen` so that you don't have to recalculate the value.

Call `stop()` if you want the reaction to stop occurring.

## Extended API

### runInAction

Every time you call a setter, like `setCount` to update a `count` field, better-mobx triggers a rerender on all fields that use `count`.

If you want to wait to rerender until a bunch of actions are complete, wrap them in `runInAction`.

So this will cause 2 renders: `setFirstName('Ethan'); setLastName('Clark');`

...and this will only cause one render: `runInAction(() => { setFirstName('Ethan'); setLastName('Clark'); })`

### integrateGlobalState

If you want to use MobX with better-mobx, you can call `integrateGlobalState()`, which will allow the two libraries to work together. Caveat: the version of MobX that you're using must match the version of better-mobx for this to work correctly.

## performance tips

better-mobx transforms all of your objects into proxies to allow it to track which observers are listening to which observables. This can be expensive with massive objects.

If you don't want a whole object to be tracked for performance reasons, wrap it in a function, like so:

```tsx
const myObs = observable('myObserver', {

  getMyGiantField: () => null,

  // you must define the getter yourself, as setters aren't auto-defined for functions
  setGetMyGaintField(value) {
    this.myGiantField = () => value
  }
})
const MyView = observer(() => (
  <div>{myObs.getMyGiantField().whateverSubfieldYouWant}</div>
))
```

## gotchas

### arrow functions

If you want to use `this` in your methods, you can't use arrow functions.

This won't work:

```tsx
const myStore = observer('myStore', {
  a: 2,
  incrementA: () => this.a++
})
```

This will work:

```tsx
const myStore = observer('myStore', {
  a: 2,
  incrementA() {
    this.a++
  }
})
```

The reason is because arrow functions are automatically context-bound, so `this` will refer to the `this` that is present when `myStore` is being declared. Non-arrow functions are not automatically context-bound, so we can bind them to your observer for you.

This will also work (if you don't appreciate the fickle nature of `this`)
```tsx
const myStore = observer('myStore', {
  a: 2,
  incrementA: () => myStore.a++
})
```

This will work, too:
```tsx
const myStore = observer('myStore', {
  a: 2,
  incrementA() {
    myStore.a++
  }
})
```

### try/catch

Do not use `try/catch` with observables. If you have runtime errors in code that reads from `observable`s, any and all of your `observers` may break. Due to the nature of JavaScript, there's no way to keep stack traces sane while still allowing the app to work in a partially-broken state.

For this reason, TypeScript's "strict" mode is deeply, _deeply_ encouraged.

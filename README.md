# `better-mobx`

better-mobx is a mobx replacement that lets you avoid a bunch of React Hook tedium.

If you don't like having to write dependency arrays, wrap all your variables in `React.useSomething()`, and/or having to jigger `react-query` to avoid unnecessary refetching, then better-mobx is for you.

Also it logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), which is nice.

better-mobx requires no knowledge of mobx, but all better-mobx objects are valid mobx objects as well, so you can use them together if you like.

## API

### observer

A React function component wrapped in `observer()` will update whenever any `observable` field (or subfield) it references updates.

### observable

`observable`s are objects for storing and updating application state. They work like this:

```tsx
const state = observable('userState', {

  users: [] as Array<User>,

  // better-mobx stores the result of this after it's called,
  // and only ever recomputes it if `this.users` changes
  get activeUsers() {
    return this.users.filter(u => !u.deactivated)
  },

  async fetchUsers(userIds) {
    const users = await fetch(...)
    this.setUsers(users) // setters are created automatically
  }

})

export const UserTable = observer(() => (
  <div>
    <div>Total users: ${state.users.length}</div>
    <table>
      { state.activeUsers.map(user => (
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

`observable`s support "computed state", which is shown by `get activeUsers()` above. "Computed state" only recomputes when fields it is derived from update.

It's worth noting that computed state is free to reference state and computed state on other observables, and methods (like `fetchUsers()`) are free to read from and modify state on other observables.

#### IMPORTANT
All observable fields should only be modified via `setters`, which are auto-generated (like `setUsers()` above).

### autorun / reaction

(TODO: adapt from https://mobx.js.org/reactions.html)

reactively(reaction, postReaction? = () => {}, runPostRxnImmediately)

### runInAction

(todo: explain transaction idea. See mobx documents.)

## Gotchas

### Auto-generated computed property setters

Ideally `better-mobx` would not auto-generate setters for computed properties (e.g., `get x()` would not result in `setX()` being available). Unfortunately, TypeScript doesn't let us differentiate between readonly/computed properties and non-readonly/computed properties in our type definitions. So we've opted to make auto-generated setters for computed properties always throw a descriptive error.

In other words, if you define `get x()` in your observable, `setX()` will also be generated, but will throw an error if you call it. If you define `setX()` yourself, `setX()` will work how you defined it, and not throw an error.

## To investigate

fetch-by-referencing
TODO: fork mobx-utils to get rid of annoying "invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set" console.error

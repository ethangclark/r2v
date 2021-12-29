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

  // better-mobx stores the result of this after it's called once,
  // and only ever recomputes it if `this.users` changes
  activeUsers() {
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

### reactively

(TODO: adapt from https://mobx.js.org/reactions.html)

reactively(reaction, postReaction? = () => {}, runPostRxnImmediately? = true)

### runInAction

(todo: explain transaction idea. See mobx documents.)

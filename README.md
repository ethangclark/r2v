# `better-mobx`

better-mobx lets you skip a bunch of React Hook tedium, specifically `useState`, `useMemo`, `useCallback`, and `useContext`. (This is not a dig on Hooks -- they are way nicer than what came before, but... There Is A Better Way.)

Also it logs everything in [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), which is nice.

## API

### observer

A React function component wrapped in `observer()` will update whenever any `observable` object it references updates.

### observable

`observable`s are objects for storing and updating application state. They look like this:

```
const userState = observable({
  users: [] as Array<User>,
  get activeUsers() { // only ever when this.users changes
    return this.users.filter(u => !u.deactivated)
  },
  async fetchUsers(userIds) {
    const users = await fetch(...)
    this.setUsers(users) // setters are created automatically
  }
})
```

`observable`s aso support "computed state". "Computed state" only recomputes when fields it is derived from update.


Methods can modify other observables, and computed state can reference state in other observables


- automatic typesafe setter generation
- baseobj will be mutated

### autorun / reaction

(TODO: adapt from https://mobx.js.org/reactions.html)

### runInAction

(todo: explain transaction idea)


## Examples


## Unsolved problems

We don't want setters to be generated automatically for `get x()` (readonly/computed fields), but we don't have a way to do that without messing up type safety. As such, if `get x()` is defined, `setX` will be defined automatically, but will be a no-op...

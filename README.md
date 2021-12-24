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


## Gotchas

### Auto-generated computed property setters

Ideally `better-mobx` would not auto-generate setters for computed properties (e.g., `get x()` would not result in `setX()` being available). Unfortunately, TypeScript doesn't let us differentiate between readonly/computed properties and non-readonly/computed properties in our type definitions. So we've opted to make auto-generated setters for computed properties always throw a descriptive error.

In other words, if you define `get x()` in your observable, `setX()` will also be generated, but will throw an error if you call it. If you define `setX()` yourself, `setX()` will work how you defined it, and not throw an error.





TODO: remove autobinding?? Because apparently I was wrong that self-reference doesn't work??

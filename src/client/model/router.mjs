import { batch, effect } from '@preact/signals'
import signalbox from '@ludlovian/signalbox'

// Route-based data fetching
// For each route named route, get the data from the URL or function

const ROUTES = {
  // About page
  '/about': '/api/about',

  // Group playlist - with each media URL also fetched
  '/group/:name/queue': ({ name }, model) => model.byName[name]?.getPlaylist()
}

// reactive data gatherer for pages
export default class Router {
  #model

  constructor (model) {
    this.#model = model

    signalbox(this, {
      // the current page URL
      url: new URL(window.location.href).pathname,

      // the current params (based on known routes)
      params: {},

      // the data needed for that page
      data: undefined
    })

    this.#start()
  }

  get model () {
    return this.#model
  }

  #start () {
    window.addEventListener('popstate', e =>
      batch(() => {
        this.url = e.state?.url ?? '/'
        this.data = undefined
      })
    )

    effect(() => this.#onChange())
  }

  route (url) {
    batch(() => {
      window.history.pushState({ url }, '', url)
      this.url = url
      this.data = undefined
    })
  }

  matches (pattern) {
    return matches(pattern, this.url)
  }

  #onChange () {
    batch(() => {
      let prom
      if (this.data) return
      for (const [pattern, fn] of Object.entries(ROUTES)) {
        const match = this.matches(pattern)
        if (match) {
          this.params = match
          if (typeof fn === 'string') {
            const url = fn
            prom = this.model.fetchData(url)
          } else if (typeof fn === 'function') {
            prom = Promise.resolve(fn(match, this.model))
          }
          if (prom) prom.then(data => (this.data = data), this.model.catch)
          return
        }
      }
    })
  }
}

function matches (pattern, path) {
  const patterns = pattern.split('/')
  const paths = path.split('/')
  if (paths.length !== patterns.length) return false
  const match = {}
  for (let i = 1; i < paths.length; i++) {
    if (patterns[i].charAt(0) === ':') {
      match[patterns[i].slice(1)] = paths[i]
    } else {
      if (patterns[i] !== paths[i]) return false
    }
  }
  return match
}
window.matches = matches

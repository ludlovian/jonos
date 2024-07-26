/** @jsx h */
import { h, toChildArray, cloneElement } from 'preact'
import { useState } from 'preact/hooks'
import { signal, batch } from '@preact/signals'
import clsx from 'clsx/lite'

const $url = signal(new URL(window.location.href).pathname)
window.$url = $url

window.addEventListener('popstate', e => ($url.value = e?.state?.url ?? '/'))

export function Router ({ prefix = '', children, ...props }) {
  // refreshes when any of these change
  const url = $url.value
  prefix = prefix.replace(/\/\*$/, '')

  let def
  for (const child of toChildArray(children)) {
    const href = child.props.href
    if (href == null) {
      def ??= child
    } else {
      const parms = matches(prefix + href, url)
      if (parms) {
        return cloneElement(child, { ...props, ...parms })
      }
    }
  }

  if (def) return cloneElement(def, props)
  return <div>404 not found</div>
}

export function AsyncRoute ({ fetch, component, ...props }) {
  // a new signal each render, which changes
  const $data = useState(signal(null))[0]
  if ($data.value) {
    return cloneElement(component, { ...props, ...$data.value })
  }
  Promise.resolve().then(async () => ($data.value = await fetch(props)))
}

export function route (url) {
  batch(() => {
    window.history.pushState({ url }, '', url)
    $url.value = url
  })
}

export function Redirect ({ url }) {
  route(url)
  return null
}

export function matches (pattern, url) {
  if (!url) url = $url.value
  const parms = {}
  const patterns = pattern.split('/')
  const paths = url.split('/')
  for (let i = 1; i < patterns.length; i++) {
    if (i >= paths.length) return false // run out of path
    const patt = patterns[i]
    const path = paths[i]
    if (patt.startsWith(':')) {
      parms[patt.slice(1)] = path // variable to capture
    } else if (patt === '*') {
      parms._ = paths.slice(i).join('/') // capture the rest
      return parms
    } else if (patt !== path) {
      return false
    }
  }
  return parms
}

export function Link ({ href, children, class: klass, ...props }) {
  if (!href) return children
  const onclick = e => {
    props.onclick && props.onclick(e)
    route(href)
    e.preventDefault()
  }
  const cls = clsx(klass, 'jonos-link')
  return (
    <div onclick={onclick} class={cls} {...props}>
      {children}
    </div>
  )
}

/** @jsx h */
import { h, toChildArray, cloneElement } from 'preact'
import clsx from 'clsx/lite'
import { useModel } from '../model/index.mjs'

export function Router ({ children }) {
  const { router } = useModel()

  for (const child of toChildArray(children)) {
    const href = child.props.href
    if (!href) return cloneElement(child)
    const match = router.matches(href)
    if (match) return cloneElement(child, match)
  }
  return <div>404 Not found</div>
}

export function Redirect ({ to }) {
  const { router } = useModel()
  router.route(to)
  return null
}

export function matches (pattern) {
  const { router } = useModel()
  return router.matches(pattern)
}

export function Link ({ href, children, class: klass, ...props }) {
  if (!href) return children

  const { router } = useModel()
  const onclick = e => {
    props.onclick && props.onclick(e)
    router.route(href)
    e.preventDefault()
  }
  const cls = clsx(klass, 'jonos-link')
  return (
    <div onclick={onclick} class={cls} {...props}>
      {children}
    </div>
  )
}

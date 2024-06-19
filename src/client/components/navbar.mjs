/** @jsx h */
import { h } from 'preact'
import clsx from 'clsx/lite'

import { matches, Link } from './router.mjs'

export function NavBar ({ children }) {
  return (
    <nav class='navbar bg-body-tertiary mb-4'>
      <div class='container-fluid'>
        <button
          class='navbar-toggler'
          type='button'
          data-bs-toggle='collapse'
          data-bs-target='#navbarList'
        >
          <span class='navbar-toggler-icon' />
        </button>
        <div class='collapse navbar-collapse' id='navbarList'>
          <div class='navbar-nav'>{children}</div>
        </div>
      </div>
    </nav>
  )
}

export function NavLink ({ href, children }) {
  return (
    <Link
      class={clsx('nav-link', matches(href) && 'active')}
      data-bs-toggle='collapse'
      data-bs-target='.navbar-collapse.show'
      href={href}
    >
      {children}
    </Link>
  )
}

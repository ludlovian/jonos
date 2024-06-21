/** @jsx h */
import { h } from 'preact'

export function Toggle ({ $signal, children, ...rest }) {
  const onclick = () => ($signal.value = !$signal.value)
  return (
    <div onclick={onclick} {...rest}>
      {children}
    </div>
  )
}

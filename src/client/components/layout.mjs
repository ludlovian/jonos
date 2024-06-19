/** @jsx h */
import { h } from 'preact'
import clsx from 'clsx/lite'

export function Row (props) {
  return <div class={clsx(props.class, 'row')}>{props.children}</div>
}

export function Col (props) {
  return <div class={clsx(props.class, 'col')}>{props.children}</div>
}

export function Text ({ children, ...props }) {
  return <span {...props}>{children}</span>
}

// Title

Row.Title = function RowTitle (props) {
  const cls = clsx(
    props.class,
    // Add margin & padding
    'row py-2 my-2 mb-3',
    // and a darker colour
    'bg-secondary-subtle'
  )
  return <div class={cls}>{props.children}</div>
}

Col.Title = function ColTitle (props) {
  const cls = clsx(
    props.class,
    // size the column to the content
    'col-auto',
    // auto centre until medium
    'mx-auto ms-md-1'
  )
  return <div class={cls}>{props.children}</div>
}

Text.Title = function TextTitle (props) {
  return <span class='h3 align-middle'>{props.children}</span>
}

// General centring

Row.Centre = function RowCentre (props) {
  const cls = clsx(props.class, 'row', 'justify-content-center')
  return <div class={cls}>{props.children}</div>
}

// Art work indentation

Col.Art = function ColArt (props) {
  // 3 cols dropping to 1
  const cls = clsx(props.class, 'col-3 col-sm-2 col-lg-1')
  return <div class={cls}>{props.children}</div>
}

// Player name indentation for volumes

Col.PlayerName = function ColPlayerName (props) {
  const cls = clsx(
    props.class,

    // offset of nothing, then 1
    'offset-sm-1',

    // size of 4 down to 2
    'col-4 col-sm-3 col-lg-2'
  )
  return <div class={cls}>{props.children}</div>
}

// Command button indentation

Col.Command = function ColCommand (props) {
  const cls = clsx(
    props.class,

    // offset of 1 up to 3
    'offset-sm-1 offset-md-2 offset-lg-3',

    // adjust the size down as it grows
    'col-12 col-sm-9 col-md-7 col-lg-5'
  )
  return <div class={cls}>{props.children}</div>
}

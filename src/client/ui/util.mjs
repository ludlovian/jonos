import { h, toChildArray, cloneElement } from 'preact'
import { useSignal } from '@preact/signals'
import htm from 'htm'

export const html = htm.bind(h)
export { toChildArray, cloneElement, useSignal }

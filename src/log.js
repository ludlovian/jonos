'use strict'

import { format } from 'util'

export default function log (...args) {
  const line = format(...args)
  console.log(line)
}

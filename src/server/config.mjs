import os from 'node:os'
import process from 'node:process'
import { parse as parseMS } from '@lukeed/ms'

// Are we in development or production
export const isDev = process.env.NODE_ENV !== 'production'

// Where are the client files
export const clientPath = './dist/public'

// How long should we ask for a notify stream to stay active
export const sonosSubscriptionTimeout = 'Second-1800'

// When should we renew a notify stream
export const sonosSubscriptionRenewal = parseMS('20m')

// How soon after the last listener should we shut down notifications
export const sonosLastListenerDelay = parseMS(isDev ? '5s' : '30s')

// After how ofen should we reset the listeners
export const sonosResetPeriod = parseMS('12h')

// How many times to try a call
export const sonosCallAttempts = 3

// How long to wait to see if a call has worked
export const sonosCallDelay = parseMS('5s')

// Throttle time for updates to clients
export const statusThrottle = 200

// Notification timeout
export const notificationTimeout = parseMS('10s')

// Settings for the HTTP server
export const serverIP = getMyIP()
export const serverPort = 3500

function getMyIP () {
  return Object.values(os.networkInterfaces())
    .flat()
    .find(({ family, internal }) => family === 'IPv4' && !internal).address
}

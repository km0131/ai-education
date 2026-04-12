import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono! AI Education Frontend is running.')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', api_url: process.env.API_URL })
})

export default {
  port: 3000,
  fetch: app.fetch,
}

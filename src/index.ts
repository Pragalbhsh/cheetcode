import { config } from './config.js'
import { createApp } from './app.js'
import prisma from './prisma.js'
import { ensureSeeded } from './seed.js'

async function main() {
  try {
    await ensureSeeded()
  } catch (error) {
    console.error('Could not verify problem data (is the database reachable and migrated?)', error)
  }

  const server = createApp().listen(config.port, () => {
    console.log(`Cheatcode API running on http://localhost:${config.port}`)
  })

  const shutdown = () => {
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(0))
    })
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main()

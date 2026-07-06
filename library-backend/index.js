require('dotenv').config()
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@as-integrations/express4')
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const http = require('http')
const cors = require('cors')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/use/ws')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const { seedDatabase } = require('./seed')
const User = require('./models/user')

const connectWithPrimaryFallback = async (user, password, db, clusterHosts) => {
  const hostnames = clusterHosts
    .split(',')
    .map((host) => host.split(':')[0].trim())

  for (const host of hostnames) {
    try {
      await mongoose.connect(`mongodb://${host}/${db}`, {
        user,
        pass: password,
        authSource: 'admin',
        ssl: true,
        directConnection: true,
        family: 4,
        serverSelectionTimeoutMS: 8000,
      })

      const hello = await mongoose.connection.db.admin().command({ hello: 1 })

      if (hello.isWritablePrimary) {
        console.log(`connected to Atlas primary: ${host}`)
        return
      }

      await mongoose.disconnect()
    } catch {
      await mongoose.disconnect().catch(() => {})
    }
  }

  throw new Error('Could not find a writable Atlas primary host')
}

const connectToDatabase = async () => {
  if (process.env.MONGODB_URI) {
    return mongoose.connect(process.env.MONGODB_URI)
  }

  const user = process.env.MONGODB_USER
  const password = process.env.MONGODB_PASSWORD
  const db = process.env.MONGODB_DB || 'graphql-library'
  const clusterHosts =
    process.env.MONGODB_CLUSTER_HOSTS ||
    'ac-bbm1fo4-shard-00-00.ddtbaco.mongodb.net:27017,ac-bbm1fo4-shard-00-01.ddtbaco.mongodb.net:27017,ac-bbm1fo4-shard-00-02.ddtbaco.mongodb.net:27017'
  const replicaSet = process.env.MONGODB_REPLICA_SET || 'atlas-bbm1fo4-shard-0'

  if (user && password) {
    try {
      await mongoose.connect(
        `mongodb://${clusterHosts}/${db}?replicaSet=${replicaSet}&authSource=admin`,
        {
          user,
          pass: password,
          ssl: true,
          retryWrites: true,
          w: 'majority',
          family: 4,
          serverSelectionTimeoutMS: 8000,
        },
      )
      console.log('connected to MongoDB replica set')
      return
    } catch {
      await mongoose.disconnect().catch(() => {})
      console.log('replica set connection failed, trying direct primary host...')
      return connectWithPrimaryFallback(user, password, db, clusterHosts)
    }
  }

  const uri = 'mongodb://127.0.0.1:27017/graphql-library'

  return mongoose.connect(uri)
}

const getContext = async ({ req }) => {
  const auth = req ? req.headers.authorization : null
  if (auth && auth.startsWith('Bearer ')) {
    const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
    const currentUser = await User.findById(decodedToken.id)
    return { currentUser }
  }
  return {}
}

const start = async () => {
  try {
    await connectToDatabase()
  } catch (error) {
    console.error('Failed to connect to MongoDB.')
    if (error.message?.includes('bad auth')) {
      console.error(
        'Authentication failed: set MONGODB_USER and MONGODB_PASSWORD in .env to match Atlas Database Access.',
      )
    } else if (error.message?.includes('timed out')) {
      console.error(
        'Connection timed out: in Atlas, open Network Access and allow your IP (or 0.0.0.0/0 for development).',
      )
    } else {
      console.error(
        'Set MONGODB_USER/MONGODB_PASSWORD or MONGODB_URI in library-backend/.env',
      )
    }
    throw error
  }

  await seedDatabase()

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })

  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await server.start()

  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: getContext,
    }),
  )

  const PORT = process.env.PORT || 4000

  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/`)
  })
}

start()

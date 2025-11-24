import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv'
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import mergedResolvers from "./resolvers/index.js"
import mergedTypeDefs from "./typeDefs/index.js"
import { connectDB } from './db/connectDb.js';
import passport from 'passport';
import session from 'express-session';
import connectMongo from "connect-mongodb-session"
import { GraphQLLocalStrategy, buildContext } from "graphql-passport";
import { configurePassport } from './passport/passport.config.js';
import path from 'path';

dotenv.config()
configurePassport()
const app = express();
const __dirname = path.resolve()
const httpServer = http.createServer(app);

const MongoDbStore = connectMongo(session);

const store = new MongoDbStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

store.on("error", (err) => console.log(err))

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
    store: store,
  })
)

app.use(passport.initialize())
app.use(passport.session())


const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})

await server.start();

// Update CORS for production
app.use(
  '/graphql',
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || true 
      : "http://localhost:3000",
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res })
  }),
);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist", "index.html"))
  })
}

const PORT = process.env.PORT || 4000;

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
await connectDB()

console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);

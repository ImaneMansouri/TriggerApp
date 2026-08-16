require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const authRouter = require("./routes/auth");
const episodesRouter = require("./routes/episodes");
const symptomsRouter = require("./routes/symptoms");
const profileRouter = require("./routes/profile");
const patternsRouter = require("./routes/patterns");
const envRouter = require("./routes/env");

const app = express();
let memoryMongo = null;

// cors() must run before your routes so the browser's preflight requests get
// the right headers back — without it, the React app on a different port gets blocked.
app.use(cors());

// express.json() parses incoming JSON bodies into req.body. Without it, req.body is
// undefined and every POST route reading req.body.email etc. would break. Must come
// before the routers below, since middleware only affects requests that reach it after.
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/episodes", episodesRouter);
app.use("/api/symptoms", symptomsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/patterns", patternsRouter);
// Mounted at "/api" rather than "/api/env" — its routes cover /api/env/backfill and
// /api/env/sync as well as the top-level /api/today, /api/export endpoints. See routes/env.js.
app.use("/api", envRouter);

async function startDatabase() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
      return;
    }

    memoryMongo = await MongoMemoryServer.create();
    await mongoose.connect(memoryMongo.getUri());
    console.log("MongoDB connected to in-memory server");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

startDatabase();

const PORT = Number(process.env.PORT || 5050);
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

async function shutdown() {
  server.close(() => {
    console.log("HTTP server stopped");
  });

  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }

  if (memoryMongo) {
    await memoryMongo.stop();
  }
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRouter = require("./routes/auth");
const entriesRouter = require("./routes/entries");

const app = express();

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
app.use("/api/entries", entriesRouter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

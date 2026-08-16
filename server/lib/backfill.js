const EnvDaily = require("../models/EnvDaily");
const User = require("../models/User");
const { fetchEnvData } = require("./openmeteo");

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

// Updates environmental data for the last 'days' days using the user's current location.
// If record does not exist, it will be created.
// Returns the number of records updated or created.
async function backfillUser(userId, days) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.lat == null || user.lon == null) {
    throw new Error("User has no saved location (lat/lon) to backfill against");
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const endDate = toISODate(end);
  const startDate = toISODate(start);

  const dailyRecords = await fetchEnvData(user.lat, user.lon, startDate, endDate);

  const ops = dailyRecords.map((day) => ({
    updateOne: {
      filter: { userId, date: day.date },
      update: { $set: { ...day, userId } },
      upsert: true,
    },
  }));

  if (ops.length === 0) {
    return 0;
  }

  await EnvDaily.bulkWrite(ops);
  return ops.length;
}

module.exports = { backfillUser };

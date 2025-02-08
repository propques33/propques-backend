const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema({
  pincode: String,
  state: String,
  city: String,
  locations: [String],
});

module.exports = mongoose.model("Pincode", pincodeSchema);

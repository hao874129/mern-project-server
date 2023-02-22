const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  id: { type: String },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectID, // primary key
    ref: "User", // 連結到 User Schema
  },
  students: {
    type: [String],
    defualt: [],
  },
});

module.exports = mongoose.model('Course',courseSchema)

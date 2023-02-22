const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes/index").auth;
const courseRoute = require("./routes/index").course;
const passport = require("passport");
require("./config/passport")(passport);
const cors = require("cors");

// 連結 NongoDB
mongoose
  .set("strictQuery", false)
  .connect("mongodb://127.0.0.1:27017/mernDB")
  .then(() => {
    console.log("Connecting to mongodb...");
  })
  .catch((e) => {
    console.log(e);
  });

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 設置 auth 的 route
app.use("/api/user", authRoute);

// course route 應受 jwt 保護 (passport.authenticate)
// 如果 request header 無 jwt，則 request 視為 unauthorized
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

app.listen(8080, () => {
  console.log("Server is listening to port 8080...");
});

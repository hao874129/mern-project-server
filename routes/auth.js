const router = require("express").Router();
const { registerValidation } = require("../validation");
const { loginValidation } = require("../validation");
const User = require("../models/index").user;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("正在接收一個跟auth有關的請求...");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("成功連結auth route...");
});

router.post("/register", async (req, res) => {
  // 確認數據是否符合 validate 規則
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認此信箱是否註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已被註冊過...");

  // 製作新用戶
  const { username, email, password, role } = req.body;
  const newUser = new User({
    username,
    email,
    password,
    role,
  });
  try {
    let saveUser = await newUser.save();
    return res.send({
      msg: "使用者成功儲存",
      saveUser,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send("無法儲存使用者...");
  }
});

router.post("/login", async (req, res) => {
  // 確認數據是否符合 validate 規則
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認此信箱是否註冊過
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("找不到此使用者資料...");
  }

  // 比對密碼是否輸入正確，並將比對結果傳入後面的 callbackFn
  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);

    if (isMatch) {
      //製作 json web token
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        msg: "成功登入",
        token: "JWT " + token, // JWT後面一定要有“空格”
        user: foundUser,
      });
    } else {
      return res.status(401).send("密碼錯誤");
    }
  });
});

module.exports = router;

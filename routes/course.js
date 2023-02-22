const router = require("express").Router();
const Course = require("../models").course;
const { courseValidation } = require("../validation");

router.use((req, res, next) => {
  console.log("正在接收一個跟course有關的請求...");
  next();
});

// 獲得系統中的所有課程
router.get("/", async (req, res) => {
  try {
    let courseFound = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 用課程id尋找課程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.find({ _id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 學生使用課程名稱查詢課程
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 講師新增課程
router.post("/", async (req, res) => {
  // 驗證數據是否符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (!req.user.isInstructor()) {
    return res
      .status(400)
      .send("只有講師可以發布新課程。若你已經是講師，請透過講師帳號登入。");
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });

    let savedCourse = await newCourse.save();
    return res.send({ message: "新課程已創建", savedCourse });
  } catch (e) {
    console.log(e);
    return res.status(500).send("無法創建此課程...");
  }
});

// 學生透過課程id註冊新課程
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id }).exec();
    if(!(course.students.some((ele) => ele === `${req.user._id}`))){
      course.students.push(req.user._id);
      await course.save();
      return res.send({ message: "課程已註冊成功" });
    }
    return res.status(500).send('您已註冊過此課程');
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 講師更改課程
router.patch("/:_id", async (req, res) => {
  // 驗證數據是否符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  // 確認課程是否存在
  try {
    let courseFound = await Course.findOne({ _id });
    if (!courseFound) {
      return res.status(400).send("找不到課程。無法更新課程內容");
    }
    // 使用者須為該課程講師，才能編輯課程
    if (courseFound.instructor.equals(req.user._id)) {
      let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({
        message: "課程已更新成功",
        updatedCourse,
      });
    } else {
      return res.status(403).send("只有該課程講師，才能編輯課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 使用學生id找到學生註冊的課程
router.get("/student/:_student_id_", async (req, res) => {
  let { _student_id_ } = req.params;
  try {
    let coursesFound = await Course.find({
      students: _student_id_,
    })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.send(e);
  }
});

// 使用講師id查找該講師擁有的課程
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  try {
    let coursesFound = await Course.find({
      instructor: _instructor_id,
    })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.send(e);
  }
});

// 講師刪除課程
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  // 確認課程是否存在
  try {
    let courseFound = await Course.findOne({ _id });
    if (!courseFound) {
      return res.status(400).send("找不到課程。無法刪除課程內容");
    }
    // 使用者須為該課程講師，才能刪除課程
    if (courseFound.instructor.equals(req.user._id)) {
      await Course.deleteOne({ _id }).exec();
      return res.send("課程刪除成功");
    } else {
      return res.status(403).send("只有該課程講師，才能刪除課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;

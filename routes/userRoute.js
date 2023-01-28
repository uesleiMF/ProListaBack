const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUser,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  loginStatus,
  getUser,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/loggedIn", loginStatus);
router.get("/getuser", protect, getUser);
router.patch("/updateuser", protect, updateUser);
router.patch("/changepassword", protect, changePassword);
router.get("/logout", logout);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;

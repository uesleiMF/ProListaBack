const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");

// Environment Variables
const JWTSecret = process.env.JWT_SECRET;
const clientURL = process.env.CLIENT_URL;

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  const token = generateToken(user._id);

  // Send the HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      phone: user.phone,
      bio: user.bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check DB if user exists
  const user = await User.findOne({ email });
  // console.log(user);

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup.");
  }
  // User exists, now Check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  const token = generateToken(user._id);

  // Send the HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Check if a use is logged in with HTTP only cookie
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.send(true);
  }
  return res.json(false);
});

// Logout
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  // console.log(resetToken);
  // Hash token before saving in db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // return console.log(hashedToken);

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60 * 1000), // Thirty Minutes
  }).save();

  // Reset url
  const resetUrl = `${clientURL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
      <h1>Hello ${user.name}</h1>
      <p>You requested for a password reset</p>
      <p>Please use the url below to reset your password</p>
      <p>This reset link is valid for only 30minutes.</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards...</p>
    `;

  try {
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Something went Wrong. Please try again");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  // console.log(password);
  // return console.log(resetToken);

  // Compare token in URL params to hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find token in db
  const userToken = await Token.findOne({
    token: resetPasswordToken,
    expiresAt: { $gt: Date.now() },
  });
  // console.log(userToken);

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired token");
  }

  // Find User
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(201).json({
    message: "Password Reset Successful, Please Login",
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // console.log(user);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      phone: user.phone,
      bio: user.bio,
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // console.log(user);
  // return console.log(req.body);

  if (user) {
    user.email = user.email;
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.bio = req.body.bio || user.bio;
    user.photo = req.body.photo || user.photo;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup.");
  }

  // Validate Request
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }
  // if (password.length < 6) {
  //   res.status(400);
  //   throw new Error("New password must be up to 6 characters");
  // }

  // User exists, now Check if password is correct
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // if password is correct, save new password
  if (user && passwordIsCorrect) {
    user.password = req.body.password;

    await user.save();

    res.status(200).send("Password change successful");
  } else {
    res.status(404);
    throw new Error("Old password is incorrect");
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  loginStatus,
};

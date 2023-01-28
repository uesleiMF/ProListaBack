const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const contactUs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { subject, message } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup.");
  }

  try {
    const send_to = process.env.EMAIL_USER;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = user.email;

    await sendEmail(subject, message, send_to, sent_from, reply_to);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Something went Wrong. Please try again");
  }
});

module.exports = {
  contactUs,
};

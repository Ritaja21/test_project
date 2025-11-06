const express = require("express");
const { getChatMessages, sendMessage } = require("../Controller/chatcontroller");
const  authenticateUser  = require("../Middlewares/authMiddleware");

const router = express.Router();

router.get("/:projectId", authenticateUser, getChatMessages);  
router.post("/:projectId", authenticateUser, sendMessage);  

module.exports = router;

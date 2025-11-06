const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // array of students
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }, // link chat to project
    messages: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model("Chat", ChatSchema);

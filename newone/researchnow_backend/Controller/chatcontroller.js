const Chat = require("../Models/ChatSchema");
const { io, onlineUsers } = require("../index.js");

// exports.getChatMessages = async (req, res) => {
//     try {
//         const { studentId } = req.params;
//         const userId = req.user.id;

//         const chat = await Chat.findOne({
//             $or: [
//                 { professor: userId, student: studentId },  // Professor fetching messages
//                 { professor: studentId, student: userId }   // Student fetching messages
//             ]
//         }).populate("messages.sender");
//         if (!chat) {
//             return res.status(404).json({ message: "Chat not found!" });
//         }

//         res.status(200).json({
//             chatId: chat._id,
//             messages: chat.messages
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error", error });
//     }
// };


exports.getChatMessages = async (req, res) => {
    try {
        const { projectId } = req.params; // fetch using chatId
        const userId = req.user.id;

        const chat = await Chat.findOne({ project: projectId }).populate("messages.sender professor students");

        if (!chat) {
            return res.status(404).json({ message: "Chat not found. Maybe application not accepted yet." });
        }

        // Optional: check if user is part of the chat
        if (chat.professor._id.toString() !== userId && !chat.students.some(s => s._id.toString() === userId)) {
            return res.status(403).json({ message: "Unauthorized access" });
        }


        res.status(200).json({
            chatId: chat._id,
            messages: chat.messages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// exports.sendMessage = async (req, res) => {
//     try {
//         const { chatId } = req.params;
//         const senderId = req.user.id;
//         const { content } = req.body;

//         const chat = await Chat.findById(chatId);
//         if (!chat) {
//             return res.status(404).json({ message: "Chat not found!" });
//         }

//         const message = { sender: senderId, content, timestamp: new Date() };
//         chat.messages.push(message);
//         await chat.save();

//         res.status(200).json({ message: "Message sent!" });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error", error });
//     }
// };


exports.sendMessage = async (req, res) => {
    try {
        const { projectId } = req.params; // now using projectId
        const senderId = req.user.id;
        const { content } = req.body;

        // 1️⃣ Find the chat linked to this project
        const chat = await Chat.findOne({ project: projectId })
            .populate("professor students"); // ✅ changed 'student' → 'students'

        if (!chat) {
            return res.status(404).json({ message: "Chat not found for this project." });
        }

        // 2️⃣ Check if the sender is part of the chat
        const isParticipant =
            chat.professor._id.toString() === senderId ||
            chat.students.some(s => s._id.toString() === senderId);

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not authorized to send messages in this chat." });
        }

        // 3️⃣ Create and save the message
        const message = { sender: senderId, content, timestamp: new Date() };
        chat.messages.push(message);
        await chat.save();

        // 4️⃣ Emit message to all participants except sender
        const participantIds = [
            chat.professor._id.toString(),
            ...chat.students.map(s => s._id.toString()),
        ];

        const receivers = participantIds.filter(id => id !== senderId);

        receivers.forEach(id => {
            const socketId = onlineUsers.get(id);
            if (socketId) {
                io.to(socketId).emit("newMessage", {
                    chatId: chat._id,
                    message: {
                        sender: senderId,
                        content,
                        timestamp: message.timestamp,
                    },
                });
                console.log(`📩 Sent message to user ${id}`);
            } else {
                console.log(`⚠️ User ${id} is offline`);
            }
        });

        res.status(200).json({ message: "Message sent to project chat!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};
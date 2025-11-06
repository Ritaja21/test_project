const express = require('express');
const http = require("http");
const {Server} = require("socket.io");
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser');

const PORT = 8000;
const cookieParser = require('cookie-parser');

//create server
const server = http.createServer(app);

//scoket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

//store connected users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Registered:", userId);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

module.exports = {server, io, onlineUsers};

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
require('dotenv').config();
require('./db')


app.use("/api/auth", require("./Routes/authRoutes"));// user authentication
app.use("/api/dashboard", require("./Routes/dashboard")); //redirect to dashboard
app.use("/api/project", require("./Routes/projectRoutes"));// create, view, apply, applied student, review application
app.use("/api/professors", require("./Routes/professorRoutes"));//view professor dashboard for students
app.use("/api/students", require("./Routes/studentRoutes"));//view student dashboard for professor
app.use("/api/chat", require("./Routes/chatRoutes"));//get and send chat message

app.get('/', (req, res) => {
    res.json({ message: 'The API is working' });
});


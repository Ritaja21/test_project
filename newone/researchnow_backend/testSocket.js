const io = require("socket.io-client");

// Replace this with the actual MongoDB user ID
const userId = "6909aec80ee3c8525f72b363";

// Connect to Socket.io server
const socket = io("http://localhost:8000");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    // Register the user with backend
    socket.emit("registerUser", userId);
});

socket.on("newMessage", (data) => {
    console.log("New message received:", data);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

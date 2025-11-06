import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  reconnection: true,
});

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [editable, setEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [chat, setChat] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch student details
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Ensure correct key
        if (!token) {
          console.error("No token found. Redirecting to login...");
          navigate("/login");
          return;
        }

        console.log("Token being sent:", token); // Debugging line

        const response = await axios.get("http://localhost:8000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.role !== "student") {
          console.error("Access denied: Not a Student.");
          navigate("/login");
          return;
        }

        setStudent(response.data);
        setUpdatedData(response.data);
      } catch (error) {
        console.error("Error fetching student data:", error);
        navigate("/login");
      }
    };

    fetchStudentData();
  }, [navigate]); // Depend only on `navigate` to prevent infinite loops

  // ✅ Socket connection
  useEffect(() => {
    if (!student?._id) return;

    socket.connect();
    console.log("🟢 Socket connected for student:", student._id);

    socket.emit("registerUser", student._id);

    // Listen for new messages
    socket.on("newChat", (data) => {
      console.log("📩 New message received:", data);
      setChat((prev) => {
        const updated = { ...prev };
        if (!updated[data.projectId]) updated[data.projectId] = [];
        updated[data.projectId].push(data.message);
        return updated;
      });
    });

    return () => {
      socket.off("newChat");
    };
  }, [student]);

  const openChat = async (projectId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://localhost:8000/api/chat/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChat((prev) => ({ ...prev, [projectId]: response.data.messages }));
      setSelectedProject(projectId);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedProject || !message.trim()) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://localhost:8000/api/chat/${selectedProject}`,
        { content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update UI instantly
      setChat((prev) => ({
        ...prev,
        [selectedProject]: [
          ...(prev[selectedProject] || []),
          { sender: { name: "You" }, content: message },
        ],
      }));

      // Emit via socket
      socket.emit("sendMessage", {
        projectId: selectedProject,
        senderId: student._id,
        content: message,
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };



  // Handle input change
  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  // Save updates
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      await axios.put("http://localhost:8000/api/dashboard", updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudent(updatedData);
      setEditable(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (!student) return <p>Loading...</p>;

  return (
    <div className="student-dashboard-container">
      {/*LEFT - Profile Section*/}
      <div className="student-left">
        <div className="profile-card">
          <h2>{editable ? "Edit Profile" : student.name}</h2>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Branch:</strong> {editable ? (
            <input type="text" name="branch" value={updatedData.branch || ""} onChange={handleChange} />
          ) : (
            student.branch || "N/A"
          )}</p>
          <p><strong>Skills:</strong> {editable ? (
            <input type="text" name="skills" value={updatedData.skills || ""} onChange={handleChange} />
          ) : (
            student.skills || "N/A"
          )}</p>
          <p><strong>About Me:</strong>{" "}
            {editable ? (
              <textarea name="about" value={updatedData.about || ""} onChange={handleChange} />
            ) : (
              student.about || "No description yet."
            )}
          </p>

          {editable ? (
            <button className="savebtn" onClick={handleSave}>Save</button>
          ) : (
            <button className="editbtn" onClick={() => setEditable(true)}>Edit Profile</button>
          )}
        </div>
      </div>
      {/*MIDDLE- PROJECTS*/}
      <div className="student-middle">
        <div className="projects-section">
          <div className="projects-header">
            <h2>My Projects</h2>
            <button className="explorebtn" onClick={() => navigate("/opportunities")}> +Explore</button>
          </div>
          {student.projects && student.projects.length > 0 ? (
            <ul>
              {student.projects.map((project) => (
                <li key={project._id}>
                  <h3>{project.title}</h3>
                  <button className="chatbtn" onClick={() => openChat(project._id)}>
                    Show Chats
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No projects enrolled yet.</p>
          )}
        </div>
      </div>


      {/* RIGHT- Chat Section */}
      <div className="student-right">
        <div className="chatbox">
          <h3>Chat</h3>
          {/* {selectedProject && (
            <div className="chatbox">
              <h3>Project Chat Room</h3>
              <div className="chat-messages">
                {chat[selectedProject]?.map((msg, index) => (
                  <p key={index}>
                    <strong>{msg.sender.name || "You"}:</strong> {msg.content}
                  </p>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="sendbtn" onClick={sendMessage}>Send</button>
              </div>
            </div>
          )} */}
          {selectedProject ? (
            <div className="chatbox">
              <h3>Project Chat Room</h3>

              <div className="chat-messages">
                {chat[selectedProject]?.length > 0 ? (
                  chat[selectedProject].map((msg, index) => (
                    <p key={index}>
                      <strong>{msg.sender?.name || "You"}:</strong> {msg.content}
                    </p>
                  ))
                ) : (
                  <p className="no-messages">No messages yet. Start the conversation!</p>
                )}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="sendbtn" onClick={sendMessage}>Send</button>
              </div>
            </div>
          ) : (
            <p className="select-chat-text">Select a project to start chatting with your student.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

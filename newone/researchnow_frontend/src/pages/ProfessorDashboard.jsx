import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProfessorDashboard.css";
import io from "socket.io-client";


const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  reconnection: true,
});


const Dashboard = () => {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [editable, setEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [appliedStudents, setAppliedStudents] = useState({});
  const [chat, setChat] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null); // Store chat ID
  const [message, setMessage] = useState("");

  // Fetch professor details
  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No token found. Redirecting to login...");
          navigate("/login");
          return;
        }

        console.log("Token being sent:", token); // Debugging line

        const response = await axios.get("http://localhost:8000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.role !== "professor") {
          console.error("Access denied: Not a Professor.");
          navigate("/login");
          return;
        }

        // Ensure projects is always an array
        const professorData = {
          ...response.data,
          projects: Array.isArray(response.data.projects) ? response.data.projects : []
        };

        // Fetch projects from localStorage if new ones are added
        const localProjects = JSON.parse(localStorage.getItem("professorProjects")) || [];

        setProfessor({
          ...professorData,
          projects: [...(professorData.projects || []), ...localProjects],
        });

      } catch (error) {
        console.error("Error fetching professor data:", error);
      }
    };

    fetchProfessorData();
  }, [navigate]);

  useEffect(() => {
    if (!professor?._id) return;


    // connect socket once when professor data is available
    socket.connect();
    // Register this professor to the backend
    socket.emit("registerUser", professor._id);
    console.log("🟢 Socket connected for professor:", professor._id);

    // Listen for incoming messages
    socket.on("newMessage", (data) => {
      console.log("📩 New message received:", data);

      setChat((prev) => {
        const updated = { ...prev };
        if (!updated[data.projectId]) updated[data.projectId] = [];
        updated[data.projectId].push(data.message);
        return updated;
      });
    });

    return () => {
      socket.off("newMessage");
    };
  }, [professor]);

  // const fetchAppliedStudents = async (projectId) => {
  //   try {
  //     const token = localStorage.getItem("authToken");
  //     const response = await axios.get(
  //       `http://localhost:8000/api/project/${projectId}/applied-students`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     setAppliedStudents((prev) => ({ ...prev, [projectId]: response.data.appliedStudents }));
  //   } catch (error) {
  //     console.error("Error fetching applied students:", error);
  //   }
  // };



  // const handleReview = async (projectId, studentId, status) => {
  //   try {
  //     const token = localStorage.getItem("authToken");
  //     await axios.put(
  //       `http://localhost:8000/api/project/${projectId}/review/${studentId}`,
  //       { status },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     fetchAppliedStudents(projectId);
  //     if (status === "accepted") {
  //       openChat(projectId);
  //     }
  //   } catch (error) {
  //     console.error("Error updating application status:", error);
  //   }
  // };


  // ✅ Delete Project
  const handleDeleteProject = async (projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`http://localhost:8000/api/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from Local Storage
      const localProjects =
        JSON.parse(localStorage.getItem("professorProjects")) || [];
      const updatedLocalProjects = localProjects.filter(
        (p) => p._id !== projectId
      );
      localStorage.setItem(
        "professorProjects",
        JSON.stringify(updatedLocalProjects)
      );

      // Remove from frontend state
      setProfessor((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p._id !== projectId),
      }));

      // Remove any applied student cache for this project
      setAppliedStudents((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });

      alert("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Try again.");
    }
  };


  // // Open Chat and Fetch Chat ID
  const openChat = async (projectId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://localhost:8000/api/chat/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setChat((prev) => ({ ...prev, [projectId]: response.data.messages }));
      setSelectedProject(projectId); // Store chat ID
      setSelectedChat(projectId);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  // // Send Message using chatId
  const sendMessage = async () => {
    if (!selectedProject || !message.trim()) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://localhost:8000/api/chat/${selectedProject}`,
        { content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChat((prev) => ({
        ...prev,
        [selectedProject]: [...(prev[selectedProject] || []), { sender: "You", content: message }],
      }));
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
  // Save updates
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put("http://localhost:8000/api/dashboard", updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfessor((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setEditable(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  if (!professor) return <p>Loading...</p>;

  return (
    <div className="professor-dashboard-container">
      {/*LEFT- Profile*/}
      <div className="professor-left">
        <div className="profile-card">
          <h2>
            {editable ? (
              <input type="text" name="name" value={updatedData.name} onChange={handleChange} />
            ) : (
              professor.name
            )}
          </h2>
          <p>
            <strong>Email:</strong> {professor.email} (Cannot be changed)
          </p>
          <p>
            <strong>Department:</strong>{" "}
            {editable ? (
              <input type="text" name="department" value={updatedData.department} onChange={handleChange} />
            ) : (
              professor.department
            )}
          </p>
          <p>
            <strong>Specialization:</strong>{" "}
            {editable ? (
              <input type="text" name="specialization" value={updatedData.specialization} onChange={handleChange} />
            ) : (
              professor.specialization
            )}
          </p>
          <p>
            <strong>Contact:</strong>{" "}
            {editable ? (
              <input type="text" name="contact" value={updatedData.contact} onChange={handleChange} />
            ) : (
              professor.contact
            )}
          </p>
          <p>
            <strong>About Me:</strong>{" "}
            {editable ? (
              <textarea name="about" value={updatedData.about} onChange={handleChange} />
            ) : (
              professor.about
            )}
          </p>
          {/* Edit / Save Button */}
          {editable ? (
            <button className="savebtn" onClick={handleSave}>Save Changes</button>
          ) : (
            <button className="editbtn" onClick={() => setEditable(true)}>Edit Profile</button>
          )}

        </div>
      </div>
      {/*MIDDLE- Projects*/}
      <div className="professor-middle">
        <div className="projects-section">
          <div className="projects-header">
            <h2>My Projects</h2>
            <button className="explorebtn" onClick={() => navigate("/addproject")}>
              + Add Project
            </button>
          </div>

          {professor?.projects?.length ? (
            <ul>
              {professor.projects.map((project) => (
                <li key={project._id}>
                  <h3>{project.title}</h3>

                  <div className="project-btns">  <button className="viewbtn" onClick={() => navigate(`/project/${project._id}/applied-students`)}>
                    View Applied Students
                  </button>
                    <button
                      className="deletebtn"
                      onClick={() => handleDeleteProject(project._id)}
                    >
                      Delete Project
                    </button></div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No projects added yet.</p>
          )}
        </div>
      </div>

      {/* RIGHT- Chat*/}
      <div className="professor-right">
        <div className="chat-section">
          <h3>Chats</h3>
          <div style={{ marginBottom: 12 }}>
            {professor.projects.length > 0 ? (
              professor.projects.map((project) => (
                <div key={project._id} className="chat-project-row">
                  <div style={{ fontWeight: 600 }}>{project.title}</div>
                  <button
                    onClick={() => openChat(project._id)}
                    style={{
                      padding: "6px 12px",
                      border: "none",
                      backgroundColor: "#1976d2",
                      color: "white",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Chat
                  </button>
                </div>
              ))
            ) : (
              <div>No projects available for chat.</div>
            )}

            {/* Chat Box*/}
 {selectedProject && (
          <div className="chatbox">
            <h4>Chat - {professor.projects.find(p => p._id === selectedProject)?.title}</h4>
            <div className="chat-messages">
              {chat[selectedProject]?.map((msg, index) => (
                <p key={index}>
                  <strong>{msg.sender?.name || "You"}:</strong> {msg.content}
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
              <button className="sendbtn" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;

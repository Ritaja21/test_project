const Project = require("../Models/ProjectSchema");
const Chat = require("../Models/ChatSchema");
const User = require("../Models/UserSchema");
const mongoose = require("mongoose");
const { io, onlineUsers } = require("../index"); // import socket and onlineUsers map


// Create a project (professor dashboard)
exports.createProject = async (req, res) => {
    try {
        const { title, domain, description, requiredSkills, professor } = req.body;

        if (req.user.role !== "professor") {
            return res.status(403).json({ message: "Access denied. Only professors can create projects." });
        }


        const professorId = req.user.id; // taken from JWT decoded user
        // if (!professor) {
        //     return res.status(400).json({ message: "Professor ID is required." });
        // }

        const project = new Project({
            title,
            domain,
            description,
            requiredSkills,
            professor: professorId
        });

        await project.save();
        // 2️⃣ Push this project into professor's User document
        await User.findByIdAndUpdate(professorId, {
            $push: { projects: project._id },
        });
        res.status(201).json({ message: "Project created successfully!", project });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};



// Get all projects (oppurtunities wala page)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate("professor", "name");
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};


// Apply to a project (apply button)
exports.applyToProject = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "student") {
            return res.status(401).json({ message: "Unauthorized. Please log in as a student." });
        }

        const { id } = req.params;
        const studentId = req.user.id.toString();

        console.log("Student ID:", studentId); // Debugging

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found!" });
        }
        console.log("Existing Applications:", project.appliedStudents); // Debugging

        if (!Array.isArray(project.appliedStudents)) {
            project.appliedStudents = [];
        }
        const alreadyApplied = project.appliedStudents.some(
            (app) => app.student && app.student.toString() === studentId
        );
        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied for this project!" });
        }

        project.appliedStudents.push({ student: new mongoose.Types.ObjectId(studentId), status: "pending" });
        await project.save();

        res.status(200).json({ message: "Application submitted successfully!" });
    } catch (error) {
        console.error("Error in applyToProject:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


// Get applied students for a project (professor dashboard project e view applied student button )
exports.getAppliedStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const professorId = req.user.id;

        const project = await Project.findById(id).populate("appliedStudents.student", "name email skills");
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }


        if (project.professor.toString() !== professorId.toString()) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json({ appliedStudents: project.appliedStudents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Accept or reject a student application (review button)
exports.reviewApplication = async (req, res) => {
    try {
        const { id, studentId } = req.params; // projectId and studentId
        const { status } = req.body;
        const professorId = req.user.id;

        // ✅ Validate status
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // ✅ Find project and populate applied students
        const project = await Project.findById(id).populate("appliedStudents.student");
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // ✅ Check if current user is the professor
        if (project.professor.toString() !== professorId.toString()) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // ✅ Find the specific student application
        const application = project.appliedStudents.find(
            app => app.student && app.student._id.toString() === studentId.toString()
        );

        if (!application) {
            return res.status(404).json({ message: "Student has not applied for this project" });
        }

        // ✅ Update application status
        application.status = status;
        await project.save();

        // ✅ If accepted, update student projects and create chat
        if (status === "accepted") {
            // Add project to student's list
            await User.findByIdAndUpdate(studentId, { $addToSet: { projects: id } });

            // Check if a chat already exists for this project
            let chat = await Chat.findOne({ project: id });
            if (!chat) {
                // Create new group chat
                chat = new Chat({
                    project: id,
                    professor: professorId,
                    students: [studentId],
                    messages: []
                });
            } else {
                // Add the new student to existing chat
                if (!chat.students.includes(studentId)) {
                    chat.students.push(studentId);
                }
            }
            await chat.save();

            // Optional: emit notification to new student
            const receiverSocketId = onlineUsers.get(studentId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newChat", {
                    chatId: chat._id,
                    professorId,
                    projectId: id,
                    message: "Your application has been accepted. Chat is now open!"
                });
            }
        }


        res.status(200).json({ message: `Application ${status} successfully!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Delete a project (only professor who created it can delete)
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const professorId = req.user.id;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.professor.toString() !== professorId.toString()) {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can delete this project.' });
        }

        await Project.findByIdAndDelete(id);

        res.status(200).json({ message: 'Project deleted successfully' });
        console.log("Deleted successfully");
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewAppliedStudents.css";

const ViewAppliedStudents = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [appliedStudents, setAppliedStudents] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAppliedStudents = async (projectId) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get(
                `http://localhost:8000/api/project/${projectId}/applied-students`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAppliedStudents((prev) => ({ ...prev, [projectId]: response.data.appliedStudents }));
        } catch (error) {
            console.error("Error fetching applied students:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleReview = async (projectId, studentId, status) => {
        try {
            const token = localStorage.getItem("authToken");
            await axios.put(
                `http://localhost:8000/api/project/${projectId}/review/${studentId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchAppliedStudents(projectId);
            if (status === "accepted") {
                openChat(projectId);
            }
        } catch (error) {
            console.error("Error updating application status:", error);
        }
    };

    useEffect(() => {
        fetchAppliedStudents(projectId);
    }, [projectId]);

    if (loading) return <p>Loading Students... </p>

    const studentsList = appliedStudents[projectId] || [];


    return (
        <div className="applied-students-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>
            <h2>Applied Students for: </h2>
            {studentsList.length > 0 ? (
                <div className="students-list">
                    {studentsList.map((studentData) => (
                        <div className="student-card" key={studentData.student?._id}>
                            <p>
                                <strong>Name:</strong> {studentData.student?.name}
                            </p>
                            <p>
                                <strong>Email:</strong> {studentData.student?.email}
                            </p>
                            <p>
                                <strong>Skills:</strong>{" "}
                                {Array.isArray(studentData.student?.skills)
                                    ? studentData.student.skills.join(", ")
                                    : studentData.student?.skills}
                            </p>
                            <p>
                                <strong>Status:</strong> {studentData.status}
                            </p>

                            {studentData.status === "pending" && (
                                <div className="student-actions">
                                    <button
                                        className="accept-btn"
                                        onClick={() =>
                                            handleReview(projectId, studentData.student?._id, "accepted")
                                        }
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() =>
                                            handleReview(projectId, studentData.student?._id, "rejected")
                                        }
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-students">No students have applied yet.</p>
            )}
        </div>
    );


};

export default ViewAppliedStudents;
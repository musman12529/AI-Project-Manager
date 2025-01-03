"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const ProjectCard = ({ project, onEditClick, onDeleteClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleEditClick = () => {
    onEditClick(project);
    setIsDropdownOpen(false);
  };

  const handleDeleteClick = () => {
    onDeleteClick(project._id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-md hover:shadow-lg transition relative z-1">
      <div className="absolute top-2 right-2 cursor-pointer">
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={handleDropdownToggle}
        >
          ...
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 bg-white border border-gray-300 shadow-md rounded-lg w-32">
            <ul className="text-sm">
              <li
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={handleEditClick}
              >
                Edit
              </li>
              <li
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={handleDeleteClick}
              >
                Delete
              </li>
            </ul>
          </div>
        )}
      </div>

      <p
        className={`text-sm font-semibold ${project.status === "In progress" ? "text-red-500" : "text-green-500"}`}
      >
        {project.status.toUpperCase()}
      </p>
      <h3 className="font-bold text-xl">{project.projectName}</h3>
      <p className="text-sm text-gray-500 mb-2">
        <strong>Due:</strong> {new Date(project.dueDate).toLocaleDateString()}
      </p>
      <p className="text-sm text-gray-600 mb-2">
        <strong>Created By:</strong> {project.userEmail}
      </p>
    </div>
  );
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProject, setNewProject] = useState({
    projectName: "",
    status: "In progress",
    dueDate: "",
  });

  const { data: session } = useSession();

  useEffect(() => {
    const fetchProjects = async () => {
      const userEmail =  localStorage.getItem("email");
      if (userEmail) {
        const response = await fetch("/api/getProject", {
          method: "GET",
          headers: {
            "user-email": userEmail,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();
        setProjects(data);
      }
    };

    fetchProjects();
  }, [session]);

  const handleAddProject = async () => {
    const userEmail =  localStorage.getItem("email");
    if (!userEmail) return;

    try {
      const response = await fetch("/api/createProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-email": userEmail,
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      setProjects((prevProjects) => [...prevProjects, data]);
      setIsModalOpen(false);
      setNewProject({
        projectName: "",
        status: "In progress",
        dueDate: "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditProject = async () => {
    const updatedProject = { ...currentProject, projectName: newProject.projectName, status: newProject.status, dueDate: newProject.dueDate };

    try {
      const response = await fetch("/api/updateProject", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "id": currentProject._id, // Add project ID in headers
        },
        body: JSON.stringify(updatedProject),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prevProjects) =>
          prevProjects.map((proj) =>
            proj._id === data._id ? data : proj
          )
        );
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentProject(null);
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`/api/deleteProject?id=${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project._id !== projectId)
        );
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  const openEditModal = (project) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setCurrentProject(project);
    setNewProject({
      projectName: project.projectName,
      status: project.status,
      dueDate: project.dueDate,
    });
  };

  const openAddModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setNewProject({
      projectName: "",
      status: "In progress",
      dueDate: "",
    });
  };

  return (
    <div className="container mx-auto p-4">
  {/* Title and Add New Project Button on the same line */}
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-4xl font-bold text-blue-500">Projects</h1>
    <button
      className="bg-blue-500 text-white px-4 py-2 rounded-md"
      onClick={openAddModal}
    >
      Add New Project
    </button>
  </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onEditClick={openEditModal}
            onDeleteClick={handleDeleteProject}
          />
        ))}
      </div>

      {/* Add/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Project" : "Create New Project"}
            </h3>
            <div>
              <label className="block mb-2">Project Name</label>
              <input
                type="text"
                value={newProject.projectName}
                onChange={(e) =>
                  setNewProject({ ...newProject, projectName: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
            </div>
            <div>
              <label className="block mb-2">Due Date</label>
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) =>
                  setNewProject({ ...newProject, dueDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
            </div>
            <div>
              <label className="block mb-2">Status</label>
              <select
                value={newProject.status}
                onChange={(e) =>
                  setNewProject({ ...newProject, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="In progress">In Progress</option>
                <option value="Completed">Completed</option>
                
              </select>
            </div>
            <button
              onClick={isEditMode ? handleEditProject : handleAddProject}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              {isEditMode ? "Save Changes" : "Create Project"}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="ml-2 px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;



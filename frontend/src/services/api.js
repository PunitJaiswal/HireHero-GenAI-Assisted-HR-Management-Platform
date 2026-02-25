// frontend/src/services/api.js

import axios from "axios";

const API_BASE = "/api";
const AUTH_BASE = "/api/auth";

export const setToken = (token) => {
    localStorage.setItem("token", token);
};

export const getToken = () => {
    return localStorage.getItem("token");
};

// Axios instance for authenticated requests
export const axiosAuth = axios.create({
    baseURL: API_BASE,
    timeout: 100000,
});

// --- EXISTING REQUEST INTERCEPTOR ---
axiosAuth.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- NEW RESPONSE INTERCEPTOR ---
axiosAuth.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth Endpoints ---
export const login = async (email, password) => {
    const res = await axios.post(`${AUTH_BASE}/login`, { email, password });
    if (res.data && res.data.token) setToken(res.data.token);
    if (res.data && res.data.id)
        localStorage.setItem("user_id", String(res.data.id));
    return res.data;
};

export const register = async (userData) => {
    const res = await axios.post(`${AUTH_BASE}/register`, userData);
    if (res.data && res.data.token) setToken(res.data.token);
    if (res.data && res.data.id)
        localStorage.setItem("user_id", String(res.data.id));
    return res.data;
};

export const getCurrentUser = async () => {
    const res = await axiosAuth.get("/auth/me");
    return res.data;
};

export const changePassword = async (passwordData) => {
    const res = await axiosAuth.put("/auth/change-password", passwordData);
    return res.data;
};

// --- Job Seeker API ---

export const getJobs = async (limit) => {
    const url = limit ? `/jobs?limit=${limit}` : "/jobs";
    const res = await axiosAuth.get(url);
    if (res.data.jobs) return res.data.jobs;
    return res.data;
};

export const applyToJob = async (jobId) => {
    const userId = localStorage.getItem("user_id") || "1";
    const res = await axiosAuth.post("/applications", {
        job_id: jobId,
        user_id: userId,
    });
    return res.data;
};

export const withdrawApplication = async (appId) => {
    const res = await axiosAuth.delete(`/applications/my/${appId}`);
    return res.data;
};

export const getApplications = async () => {
    const res = await axiosAuth.get("/applications/my");

    if (Array.isArray(res.data)) {
        return res.data.map((item) => ({
            id: item.application_details.id,
            job_id: item.application_details.job_id,
            status: item.application_details.status,
            applied_at: item.application_details.applied_at,
            title: item.job_details.title,
            company: item.job_details.company,
            tags: item.job_details.tags || [],
            description: item.job_details.description,
            salary: item.job_details.salary || "Not disclosed",
        }));
    }
    return [];
};

export const getProfileMe = async (userId) => {
    const res = await axiosAuth.get("/profiles/me", {
        headers: userId ? { "X-User-Id": userId } : {},
    });
    return res.data;
};

export const updateProfileMe = async (userId, data) => {
    const res = await axiosAuth.put("/profiles/me", data, {
        headers: userId ? { "X-User-Id": userId } : {},
    });
    return res.data;
};

export const addExperience = async (experienceData) => {
    const res = await axiosAuth.post(
        "/profiles/me/experiences",
        experienceData
    );
    return res.data;
};

export const deleteExperience = async (expId) => {
    const res = await axiosAuth.delete(`/profiles/me/experiences/${expId}`);
    return res.data;
};

export const addEducation = async (educationData) => {
    const res = await axiosAuth.post("/profiles/me/education", educationData);
    return res.data;
};

export const deleteEducation = async (id) => {
    const res = await axiosAuth.delete(`/profiles/me/education/${id}`);
    return res.data;
};

export const uploadResume = async (userId, file) => {
    const formData = new FormData();
    formData.append("resume", file);
    const res = await axiosAuth.post("/profiles/me/resume", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            ...(userId ? { "X-User-Id": userId } : {}),
        },
    });
    return res.data;
};

export const uploadProfilePic = async (userId, file) => {
    const formData = new FormData();
    formData.append("profile_pic", file);
    const res = await axiosAuth.post("/profiles/me/avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            ...(userId ? { "X-User-Id": userId } : {}),
        },
    });
    return res.data;
};

export const acceptJobOffer = async (appId) => {
    const res = await axiosAuth.put(`/applications/my/${appId}/accept`);
    return res.data;
};

// --- Interview API ---

export const getMyInterviews = async () => {
    const res = await axiosAuth.get("/interviews/my");
    return res.data;
};

export const scheduleInterview = async (interviewData) => {
    const res = await axiosAuth.post("/hr/interviews", interviewData);
    return res.data;
};

// --- HR API ---

export const getEmployees = async () => {
    const res = await axiosAuth.get("/hr/employees");
    if (res.data.employees) return res.data.employees;
    return res.data;
};

export const getCandidates = async () => {
    const res = await axiosAuth.get("/auth/users/basic");
    return res.data;
};

export const getCompanyApplications = async (jobId = null) => {
    const url = jobId ? `/hr/applications?job_id=${jobId}` : "/hr/applications";
    const res = await axiosAuth.get(url);
    if (res.data.applications) return res.data.applications;
    return [];
};

export const updateApplicationStatus = async (appId, status) => {
    const res = await axiosAuth.put(`/hr/applications/${appId}`, { status });
    return res.data;
};

export const createEmployee = async (employeeData) => {
    const res = await axiosAuth.post("/hr/employees", employeeData);
    return res.data;
};

export const updateEmployee = async (id, data) => {
    const res = await axiosAuth.put(`/hr/employees/${id}`, data);
    return res.data;
};

export const deleteEmployee = async (id) => {
    const res = await axiosAuth.delete(`/hr/employees/${id}`);
    return res.data;
};

export const createJob = async (jobData) => {
    const payload = {
        title: jobData.title,
        description: jobData.description,
        company: jobData.company || "",
        department: jobData.department || "",
        location: jobData.location,
        type: jobData.type,
        remote_option: jobData.remote_option || "",
        experience_level: jobData.experience_level || "",
        education: jobData.education || "",
        salary: jobData.salary,
        tags: jobData.requiredSkills || [],
        benefits: Array.isArray(jobData.benefits)
            ? jobData.benefits.join(",")
            : jobData.benefits || "",
        application_deadline: jobData.application_deadline || "",
    };
    const res = await axiosAuth.post("/hr/jobs", payload);
    return res.data;
};

export const getMyJobs = async () => {
    const res = await axiosAuth.get("/hr/jobs/my");
    if (res.data.jobs) return res.data.jobs;
    return [];
};

export const getProfileByUserId = async (userId) => {
    const res = await axiosAuth.get(`/hr/profiles/${userId}`);
    return res.data;
};

export const getProfiles = async () => {
    return [];
};

// --- Public Profile API (UPDATED for Self-View Check) ---
export const getPublicProfile = async (userId) => {
    // Manually attach token if exists, so backend knows who is viewing
    const token = localStorage.getItem("token");
    const config = {};
    if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
    }
    // Use plain axios (not axiosAuth) to allow call even if token is expired/invalid
    // but pass the header if we have it
    const res = await axios.get(`${API_BASE}/public/profile/${userId}`, config);
    return res.data;
};

// --- GenAI API ---

export const askChatbot = async (prompt) => {
    const res = await axiosAuth.post("/gen-ai/chat", { prompt });
    return res.data;
};

export const getChatHistory = async () => {
    const res = await axiosAuth.get("/gen-ai/history");
    return res.data;
};

export const clearChatHistory = async () => {
    const res = await axiosAuth.delete("/gen-ai/history");
    return res.data;
};

export const generatePerformanceInsights = async () => {
    const res = await axiosAuth.post("/gen-ai/performance-insights");
    return res.data;
};

export const generateCoverLetter = async (data) => {
    const res = await axiosAuth.post("/gen-ai/generate-cover-letter", data);
    return res.data;
};

export const getRecommendedJobs = async () => {
    const res = await axiosAuth.get("/jobs/recommendations");
    return res.data.jobs;
};

export const getJobMatchAnalysis = async (jobId) => {
    const res = await axiosAuth.get(`/jobs/${jobId}/match-analysis`);
    return res.data;
};

export const getApplicationExplanation = async (appId) => {
    const res = await axiosAuth.get(`/hr/applications/${appId}/explanation`);
    return res.data;
};

export const getDepartments = async () => {
    const res = await axiosAuth.get("/departments");
    return res.data;
};

export const addPerformanceReview = async (empId, reviewData) => {
    const res = await axiosAuth.post(
        `/hr/employees/${empId}/performance-reviews`,
        reviewData
    );
    return res.data;
};

export const startMockInterview = async (jobId) => {
    const res = await axiosAuth.post("/gen-ai/mock-interview/start", {
        job_id: jobId,
    });
    return res.data;
};

export const submitMockInterview = async (data) => {
    // data = { job_id, answers: [{question, answer}] }
    const res = await axiosAuth.post("/gen-ai/mock-interview/submit", data);
    return res.data;
};

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaBell,
  FaCloud,
  FaCloudUploadAlt,
  FaCopy,
  FaDatabase,
  FaDownload,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaImage,
  FaLink,
  FaPlus,
  FaSearch,
  FaShareAlt,
  FaTimes,
  FaTrash,
  FaUser,
  FaUsers,
  FaVideo,
  FaClock,
  FaHome,
  FaSpinner,
  FaUserCircle,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";
import { Files } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);

  const [activeMenu, setActiveMenu] = useState("drive");

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const [folderName, setFolderName] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewError, setPreviewError] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);

  const [fileToDelete, setFileToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [downloadFile, setDownloadFile] = useState(null);

  const [downloadProgress, setDownloadProgress] = useState(0);

  const [renamingFile, setRenamingFile] = useState(null);

  const [newFileName, setNewFileName] = useState("");

  const [renaming, setRenaming] = useState(false);

  const [sharingFile, setSharingFile] = useState(null);

  const [sharedUsers, setSharedUsers] = useState([]);

  const [shareEmail, setShareEmail] = useState("");

  const [shareRole, setShareRole] = useState("viewer");

  const [accessType, setAccessType] = useState("restricted");

  const [shareToken, setShareToken] = useState(null);

  const [sharing, setSharing] = useState(false);

  const [loadingShareData, setLoadingShareData] = useState(false);

  const [updatingLinkAccess, setUpdatingLinkAccess] = useState(false);

  const [removingUserId, setRemovingUserId] = useState(null);

  // ========== UPLOAD PROGRESS STATES ==========
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ========== FOLDER STATES ==========
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolderRename, setSavingFolderRename] = useState(false);
  const [downloadingFolder, setDownloadingFolder] = useState(null);
  const [folderDownloadProgress, setFolderDownloadProgress] = useState(0);
  const [sharingFolder, setSharingFolder] = useState(null);

  // ========== LOGOUT CONFIRMATION STATE ==========
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ========== LOGOUT ANIMATION STATE ==========
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ========== DOWNLOAD ABORT CONTROLLER ==========
  const [downloadAbortController, setDownloadAbortController] = useState(null);

  // ========== PROFILE STATES ==========
  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [editName, setEditName] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [editPassword, setEditPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const firstName = user?.full_name
    ? user.full_name.split(" ")[0]
    : "User";

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [filesResponse, foldersResponse, statsResponse] = await Promise.all([
        api.get("/files/"),
        api.get("/folders/"),
        api.get("/files/stats/"),
      ]);

      setFiles(filesResponse.data || []);
      setFolders(foldersResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (err) {
      console.error("Dashboard data error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => {
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const formatBytes = (bytes = 0) => {
    if (!bytes || bytes === 0) {
      return "0 B";
    }

    const sizes = ["B", "KB", "MB", "GB", "TB"];

    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(1))} ${sizes[index]}`;
  };

  const getFileCategory = (file) => {
    const type = file.mime_type || "";

    if (type.startsWith("image/")) {
      return "image";
    }

    if (type.startsWith("video/")) {
      return "video";
    }

    return "document";
  };

  const getFileIcon = (file) => {
    const category = getFileCategory(file);

    if (category === "image") {
      return <FaImage className="text-base sm:text-lg text-purple-500" />;
    }

    if (category === "video") {
      return <FaVideo className="text-base sm:text-lg text-red-500" />;
    }

    return <FaFileAlt className="text-base sm:text-lg text-blue-500" />;
  };

  const imageCount = useMemo(() => {
    return files.filter((file) => getFileCategory(file) === "image").length;
  }, [files]);

  const documentCount = useMemo(() => {
    return files.filter((file) => getFileCategory(file) === "document").length;
  }, [files]);

  const videoCount = useMemo(() => {
    return files.filter((file) => getFileCategory(file) === "video").length;
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    return files.filter((file) =>
      file.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const recentFiles = useMemo(() => {
    return filteredFiles.slice(0, 5);
  }, [filteredFiles]);

  const storageUsed = stats?.total_size || 0;

  const storageLimit = stats?.storage_limit || 20 * 1024 * 1024 * 1024;

  const storagePercentage = storageLimit > 0
    ? Math.min((storageUsed / storageLimit) * 100, 100)
    : 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (selected.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingFile(selected);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selected);

      const response = await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(percentage);
          }
        },
      });

      setUploadProgress(100);

      if (response.status === 200 || response.status === 201) {
        setSuccess("File uploaded successfully.");
        await loadDashboardData();
      } else {
        throw new Error("Upload failed with status: " + response.status);
      }

      setTimeout(() => {
        setUploadProgress(0);
        setUploadingFile(null);
        setIsUploading(false);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Server response:", err.response?.data);

      let errorMessage = "File upload failed.";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setUploadProgress(0);
      setUploadingFile(null);
      setIsUploading(false);
    } finally {
      event.target.value = "";
    }
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();

    if (!folderName.trim()) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.post("/folders/", {
        name: folderName.trim(),
        parent_id: null,
      });

      setFolderName("");
      setShowCreateFolder(false);

      setSuccess("Folder created successfully.");

      await loadDashboardData();
    } catch (err) {
      console.error("Create folder error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to create folder."
      );
    }
  };

  const handlePreviewFile = async (file) => {
    try {
      setSelectedFile(file);
      setPreviewLoading(true);
      setPreviewError("");

      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      const response = await api.get(`/files/${file.id}/preview`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);

      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewError(
        err.response?.data?.detail ||
        "Unable to open this file."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setSelectedFile(null);
    setPreviewError("");
  };

  const cancelDownload = () => {
    if (downloadAbortController) {
      downloadAbortController.abort();
      setDownloadAbortController(null);
    }
    setDownloadFile(null);
    setDownloadProgress(0);
    setError("Download cancelled.");
  };

  const handleDownload = async (file) => {
    try {
      const controller = new AbortController();
      setDownloadAbortController(controller);

      setDownloadFile(file);
      setDownloadProgress(0);
      setError("");

      const response = await api.get(`/files/${file.id}/download`, {
        responseType: "blob",
        signal: controller.signal,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setDownloadProgress(percentage);
          } else {
            setDownloadProgress(0);
          }
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadProgress(100);

      setTimeout(() => {
        setDownloadFile(null);
        setDownloadProgress(0);
        setDownloadAbortController(null);
        setSuccess("File downloaded successfully.");
      }, 800);
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
        console.log("Download cancelled by user");
        setDownloadFile(null);
        setDownloadProgress(0);
        setDownloadAbortController(null);
        setError("Download cancelled.");
      } else {
        console.error("Download error:", err);
        setDownloadFile(null);
        setDownloadProgress(0);
        setDownloadAbortController(null);
        setError("Unable to download file.");
      }
    }
  };

  const confirmDeleteFile = (file) => {
    setOpenMenuId(null);
    setFileToDelete(file);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/files/${fileToDelete.id}`);

      setSuccess(`"${fileToDelete.original_name}" moved to Trash.`);

      setFileToDelete(null);

      await loadDashboardData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete file."
      );
    } finally {
      setDeleting(false);
    }
  };

  const openRenameModal = (file) => {
    setOpenMenuId(null);

    setRenamingFile(file);

    setNewFileName(file.original_name);
  };

  const handleRenameFile = async (event) => {
    event.preventDefault();

    if (!renamingFile || !newFileName.trim()) {
      return;
    }

    try {
      setRenaming(true);

      await api.put(`/files/${renamingFile.id}/rename`, {
        original_name: newFileName.trim(),
      });

      setSuccess("File renamed successfully.");

      setRenamingFile(null);
      setNewFileName("");

      await loadDashboardData();
    } catch (err) {
      console.error("Rename error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to rename file."
      );
    } finally {
      setRenaming(false);
    }
  };

  const openShareModal = async (file) => {
    setOpenMenuId(null);

    setSharingFile(file);
    setSharedUsers([]);
    setShareEmail("");
    setShareRole("viewer");
    setAccessType("restricted");
    setShareToken(null);
    setLoadingShareData(true);
    setError("");

    try {
      const response = await api.get(`/shares/files/${file.id}`);

      const data = response.data || {};

      setSharedUsers(data.shared_users || []);
      setAccessType(data.access_type || "restricted");
      setShareToken(data.share_token || data.token || null);
    } catch (err) {
      console.error("Share data error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load sharing information."
      );
    } finally {
      setLoadingShareData(false);
    }
  };

  const closeShareModal = () => {
    setSharingFile(null);
    setSharingFolder(null);
    setSharedUsers([]);
    setShareEmail("");
    setShareRole("viewer");
    setAccessType("restricted");
    setShareToken(null);
    setLoadingShareData(false);
    setUpdatingLinkAccess(false);
    setRemovingUserId(null);
  };

  const handleShareWithUser = async (event) => {
    event.preventDefault();

    if (!sharingFile || !shareEmail.trim()) {
      return;
    }

    try {
      setSharing(true);
      setError("");

      const response = await api.post(`/shares/files/${sharingFile.id}`, {
        email: shareEmail.trim(),
        role: shareRole,
      });

      setSharedUsers((previous) => {
        const existingIndex = previous.findIndex(
          (item) => item.id === response.data.id
        );

        if (existingIndex >= 0) {
          const updated = [...previous];
          updated[existingIndex] = response.data;
          return updated;
        }

        return [response.data, ...previous];
      });

      setShareEmail("");
      setSuccess("File shared successfully.");
    } catch (err) {
      console.error("Share error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to share file."
      );
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveSharedUser = async (userId) => {
    if (!sharingFile) {
      return;
    }

    try {
      setRemovingUserId(userId);
      setError("");

      await api.delete(`/shares/files/${sharingFile.id}/users/${userId}`);

      setSharedUsers((previous) =>
        previous.filter((sharedUser) => sharedUser.id !== userId)
      );

      setSuccess("User access removed.");
    } catch (err) {
      console.error("Remove user error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to remove user."
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleLinkAccessChange = async (newAccessType) => {
    if (!sharingFile || updatingLinkAccess) {
      return;
    }

    const previousAccessType = accessType;
    const previousToken = shareToken;

    try {
      setUpdatingLinkAccess(true);
      setError("");

      setAccessType(newAccessType);

      const response = await api.put(`/shares/files/${sharingFile.id}/link`, {
        access_type: newAccessType,
      });

      const data = response.data || {};

      setAccessType(data.access_type || newAccessType);
      setShareToken(data.token || data.share_token || previousToken || null);

      setSuccess(
        newAccessType === "anyone_with_link"
          ? "Anyone with the link can now access this file."
          : "Link access restricted."
      );
    } catch (err) {
      console.error("Link access error:", err);
      setAccessType(previousAccessType);
      setShareToken(previousToken);
      setError(
        err.response?.data?.detail ||
        "Unable to update link access."
      );
    } finally {
      setUpdatingLinkAccess(false);
    }
  };

  const getShareLink = () => {
    if (!shareToken) {
      return "";
    }

    return `${window.location.origin}/shared/${shareToken}`;
  };

  const handleCopyShareLink = async () => {
    const link = getShareLink();

    if (!link) {
      setError("Share link is not available yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setSuccess("Share link copied to clipboard.");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      setSuccess("Share link copied to clipboard.");
    }
  };

  // ========== FOLDER FUNCTIONS ==========

  const openRenameFolderModal = (folder) => {
    setOpenFolderMenuId(null);

    setRenamingFolder(folder);

    setNewFolderName(folder.name);
  };

  const handleRenameFolder = async (event) => {
    event.preventDefault();

    if (!renamingFolder || !newFolderName.trim()) {
      return;
    }

    try {
      setSavingFolderRename(true);
      setError("");

      await api.put(`/folders/${renamingFolder.id}/rename`, {
        name: newFolderName.trim(),
      });

      setSuccess("Folder renamed successfully.");

      setRenamingFolder(null);
      setNewFolderName("");

      await loadDashboardData();
    } catch (err) {
      console.error("Folder rename error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to rename folder."
      );
    } finally {
      setSavingFolderRename(false);
    }
  };

  const confirmDeleteFolder = (folder) => {
    setOpenFolderMenuId(null);

    setFolderToDelete(folder);
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) {
      return;
    }

    try {
      setDeletingFolder(true);
      setError("");

      await api.delete(`/folders/${folderToDelete.id}`);

      setSuccess(`"${folderToDelete.name}" deleted successfully.`);

      setFolderToDelete(null);

      await loadDashboardData();
    } catch (err) {
      console.error("Folder delete error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete folder."
      );
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleFolderDownload = async (folder) => {
    try {
      setDownloadingFolder(folder);
      setFolderDownloadProgress(0);
      setError("");

      const response = await api.get(`/folders/${folder.id}/download`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setFolderDownloadProgress(percentage);
          }
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${folder.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setFolderDownloadProgress(100);

      setTimeout(() => {
        setDownloadingFolder(null);
        setFolderDownloadProgress(0);
      }, 800);

      setSuccess("Folder downloaded successfully.");
    } catch (err) {
      console.error("Folder download error:", err);
      setDownloadingFolder(null);
      setFolderDownloadProgress(0);
      setError(
        err.response?.data?.detail ||
        "Unable to download folder."
      );
    }
  };

  const openShareFolderModal = async (folder) => {
    setOpenFolderMenuId(null);

    setSharingFolder(folder);

    setSharingFile(null);
    setSharedUsers([]);
    setShareEmail("");
    setShareRole("viewer");
    setAccessType("restricted");
    setShareToken(null);
    setLoadingShareData(true);
    setError("");

    try {
      const response = await api.get(`/shares/folders/${folder.id}`);

      const data = response.data || {};

      setSharedUsers(data.shared_users || []);
      setAccessType(data.access_type || "restricted");
      setShareToken(data.share_token || data.token || null);
    } catch (err) {
      console.error("Folder share data error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load folder sharing information."
      );
    } finally {
      setLoadingShareData(false);
    }
  };

  // ========== PROFILE FUNCTIONS ==========

  const openProfile = () => {
    setShowProfile(true);
    setNewFullName(user?.full_name || "");
    setProfileError("");
    setProfileSuccess("");
    setEditName(false);
    setEditPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const closeProfile = () => {
    setShowProfile(false);
    setEditName(false);
    setEditPassword(false);
    setProfileError("");
    setProfileSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUpdateName = async (event) => {
    event.preventDefault();

    if (!newFullName.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      const response = await api.put("/me", {
        full_name: newFullName.trim(),
      });

      if (response.data) {
        updateUser({ full_name: response.data.full_name || newFullName.trim() });
      }

      setProfileSuccess("Name updated successfully.");
      setEditName(false);

      await loadDashboardData();
    } catch (err) {
      console.error("Update name error:", err);
      console.error("Error details:", err.response?.data);

      setProfileError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to update name. Please try again."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setProfileError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setProfileError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError("New passwords do not match.");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      await api.put("/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setProfileSuccess("Password updated successfully.");
      setEditPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Update password error:", err);
      console.error("Error details:", err.response?.data);

      setProfileError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to update password. Please check your current password."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // ========== UPDATED LOGOUT FUNCTION WITH ANIMATION ==========
  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }

    // Show animation for 2 seconds before redirecting
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
      navigate("/login");
    }, 2000);
  };

  const handleSidebarClick = (menu) => {
    setActiveMenu(menu);

    if (menu === "recent") {
      navigate("/files");
    }

    if (menu === "trash") {
      navigate("/trash");
    }

    if (menu === "drive") {
      navigate("/dashboard");
    }
  };

  // ========== LOADING OVERLAY ==========
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="flex flex-col items-center px-4">
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/50">
            <FaCloud className="text-3xl sm:text-4xl md:text-5xl text-white animate-bounce" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 animate-pulse text-center">
          CloudVault
        </h2>
        <p className="text-blue-200/80 text-sm sm:text-base md:text-lg text-center">
          Loading your files...
        </p>

        <div className="mt-4 sm:mt-6 flex gap-1.5 sm:gap-2">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-blue-400 animate-bounce"></span>
        </div>

        <div className="mt-6 sm:mt-8 w-32 sm:w-40 md:w-48 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float">☁️</div>
          <div className="absolute -bottom-20 -right-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float-delayed">☁️</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[150px] sm:text-[200px] md:text-[300px] animate-spin-slow">☁️</div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-5deg); }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );

  // ========== LOGOUT ANIMATION OVERLAY ==========
  const LogoutOverlay = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="flex flex-col items-center px-4">
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20 blur-2xl"></div>
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-2xl shadow-red-500/50">
            <FaCloud className="text-3xl sm:text-4xl md:text-5xl text-white animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 animate-pulse text-center">
          CloudVault
        </h2>
        <p className="text-red-200/80 text-sm sm:text-base md:text-lg text-center">
          Logging out...
        </p>

        <div className="mt-4 sm:mt-6 flex gap-1.5 sm:gap-2">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-red-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-red-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full bg-red-400 animate-bounce"></span>
        </div>

        <div className="mt-6 sm:mt-8 w-32 sm:w-40 md:w-48 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-red-400 to-red-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float">☁️</div>
          <div className="absolute -bottom-20 -right-20 text-white/5 text-[100px] sm:text-[150px] md:text-[200px] animate-float-delayed">☁️</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[150px] sm:text-[200px] md:text-[300px] animate-spin-slow">☁️</div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-5deg); }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  if (isLoggingOut) {
    return <LogoutOverlay />;
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />

      {success && (
        <div className="fixed right-3 sm:right-4 top-3 sm:top-4 z-[100] max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-xl bg-green-600 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-xl">
          <div className="break-words">{success}</div>
        </div>
      )}

      {error && (
        <div className="fixed right-3 sm:right-4 top-3 sm:top-4 z-[100] max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-xl bg-red-500 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-xl">
          <div className="break-words">{error}</div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {isUploading && uploadingFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[280px] sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 shadow-2xl backdrop-blur-lg">
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-6 sm:pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3 sm:mb-4">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
                    <FaCloudUploadAlt className="text-2xl sm:text-3xl text-blue-600" />
                  </div>
                  {uploadProgress === 100 && (
                    <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-green-500 text-white text-[8px] sm:text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {uploadProgress === 100 ? "Upload Complete" : "Uploading File"}
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-slate-500 truncate max-w-[200px] sm:max-w-full">
                  {uploadProgress === 100
                    ? "Your file has been uploaded successfully"
                    : uploadingFile.name}
                </p>

                <div className="mt-3 sm:mt-4 w-full">
                  <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500">
                      {formatBytes(uploadingFile.size)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                        background: uploadProgress === 100
                          ? "linear-gradient(to right, #22c55e, #16a34a)"
                          : "linear-gradient(to right, #3b82f6, #2563eb)",
                      }}
                    />
                  </div>
                </div>

                {uploadProgress < 100 && (
                  <div className="mt-3 sm:mt-5 w-full">
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                      <span>Uploading...</span>
                      <span className="animate-pulse">⏳</span>
                    </div>
                  </div>
                )}

                {uploadProgress === 100 && (
                  <div className="mt-3 sm:mt-5 w-full">
                    <div className="flex justify-center text-[10px] sm:text-xs text-green-600 font-medium">
                      ✓ Done
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">

        {/* Sidebar - Hidden on mobile, shown on md+ */}
        <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-[200px] lg:w-[215px] flex-col border-r border-slate-200 bg-white">

          <div className="flex items-center gap-2 lg:gap-3 border-b border-slate-200 px-3 lg:px-5 py-3 lg:py-4">
            <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <FaCloud className="text-xs lg:text-sm text-white" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-slate-800">
                CloudVault
              </h1>
              <p className="text-[8px] lg:text-[10px] text-slate-500">
                Cloud Storage
              </p>
            </div>
          </div>

          <div className="px-2 lg:px-3 pt-3 lg:pt-5">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <FaCloudUploadAlt className="text-sm lg:text-base" />
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>

          <nav className="mt-3 lg:mt-5 space-y-1 lg:space-y-2 px-2 lg:px-3">
            <button
              type="button"
              onClick={() => handleSidebarClick("drive")}
              className={`flex w-full items-center gap-2 lg:gap-3 rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium transition ${activeMenu === "drive"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <FaCloud className="text-sm lg:text-base" />
              My Drive
            </button>

            <button
              type="button"
              onClick={() => handleSidebarClick("recent")}
              className={`flex w-full items-center gap-2 lg:gap-3 rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium transition ${activeMenu === "recent"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <FaFolder className="text-sm lg:text-base" />
              All Files
            </button>

            <button
              type="button"
              onClick={() => handleSidebarClick("trash")}
              className={`flex w-full items-center gap-2 lg:gap-3 rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium transition ${activeMenu === "trash"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <FaTrash className="text-sm lg:text-base" />
              Trash
            </button>
          </nav>

          <div className="mt-auto px-2 lg:px-3 pb-3 lg:pb-4">
            <div className="mb-3 lg:mb-4 rounded-2xl bg-slate-100 p-3 lg:p-4">
              <div className="mb-2 lg:mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <FaDatabase className="text-blue-600 text-sm lg:text-base" />
                  <span className="text-xs lg:text-sm font-semibold text-slate-700">
                    Storage
                  </span>
                </div>
                <span className="text-[8px] lg:text-[10px] text-slate-500">
                  {formatBytes(storageLimit)}
                </span>
              </div>
              <div className="h-1.5 lg:h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="mt-1.5 lg:mt-2 text-[8px] lg:text-[10px] text-slate-500">
                {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl px-1 lg:px-2 py-1.5 lg:py-2">
              <button
                type="button"
                onClick={openProfile}
                className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3"
              >
                <div className="flex h-8 w-8 lg:h-9 lg:w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 text-xs lg:text-sm">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-[10px] lg:text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                    {user?.full_name || "User"}
                  </p>
                  <p className="truncate text-[8px] lg:text-[10px] text-slate-400">
                    {user?.email || ""}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-[10px] lg:text-xs font-medium text-red-500 hover:text-red-600 flex-shrink-0 ml-1 lg:ml-2"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="min-h-screen flex-1 pb-24 md:ml-[200px] lg:ml-[215px] md:pb-0">

          {/* Header */}
          <header className="sticky top-0 z-20 flex min-h-[56px] sm:min-h-[64px] items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 md:h-[68px] lg:h-[72px] md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 md:hidden">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200">
                <FaCloud className="text-white text-sm sm:text-base" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-800">
                  CloudVault
                </h1>
                <p className="text-[8px] sm:text-[10px] text-slate-500">
                  My Storage
                </p>
              </div>
            </div>

            <div className="relative flex-1 max-w-[180px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[520px]">
              <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search files..."
                className="w-full rounded-xl bg-slate-100 py-2 sm:py-3 pl-8 sm:pl-11 pr-3 sm:pr-4 text-xs sm:text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="button"
              onClick={openProfile}
              className="ml-2 sm:ml-3 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              <FaUser className="text-xs sm:text-sm" />
            </button>
          </header>

          <div className="p-3 sm:p-4 md:p-5 lg:p-6">

            {/* Welcome Section */}
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-600">
                  CloudVault Dashboard
                </p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
                  Welcome back, {firstName} 👋
                </h2>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
                  Manage and organize all your files in one place.
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FaPlus className="text-xs sm:text-sm" />
                  <span className="hidden xs:inline">New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <FaCloudUploadAlt className="text-xs sm:text-sm" />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-3 sm:p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                      Total Files
                    </p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">
                      {files.length}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <FaFileAlt className="text-sm sm:text-base" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 sm:p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                      Images
                    </p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">
                      {imageCount}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <FaImage className="text-sm sm:text-base" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 sm:p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                      Documents
                    </p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">
                      {documentCount}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <FaFileAlt className="text-sm sm:text-base" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3 sm:p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                      Videos
                    </p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-800">
                      {videoCount}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <FaVideo className="text-sm sm:text-base" />
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Overview */}
            <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    Storage Overview
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
                    {formatBytes(storageUsed)} used of {formatBytes(storageLimit)}
                  </p>
                </div>
                <span className="text-base sm:text-lg font-bold text-blue-600">
                  {Math.round(storagePercentage)}%
                </span>
              </div>
              <div className="h-2 sm:h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            {/* Folders Section */}
            <div className="mb-4 sm:mb-6">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    My Folders
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Organize your files
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(true)}
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  + New Folder
                </button>
              </div>

              {folders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-8 text-center">
                  <FaFolder className="mx-auto mb-2 sm:mb-3 text-3xl sm:text-4xl text-slate-300" />
                  <p className="text-sm sm:text-base font-semibold text-slate-600">
                    No folders yet
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">
                    Create a folder to organize your files.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolder(true)}
                    className="mt-3 sm:mt-5 rounded-xl bg-blue-600 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Create Folder
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {folders.map((folder, index) => (
                    <div
                      key={folder.id}
                      className="group relative min-h-[110px] sm:min-h-[140px] rounded-2xl bg-white p-3 sm:p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/folders/${folder.id}`, {
                            state: { folderName: folder.name },
                          })
                        }
                        className="flex h-full w-full flex-col items-center justify-center"
                      >
                        <div className="mb-2 sm:mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-blue-50 transition group-hover:bg-blue-100">
                          <FaFolder className="text-2xl sm:text-4xl text-blue-500 transition group-hover:scale-110" />
                        </div>
                        <p className="max-w-full truncate text-center text-xs sm:text-sm font-semibold text-slate-700">
                          {folder.name}
                        </p>
                      </button>

                      <div className="absolute right-2 sm:right-3 top-2 sm:top-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenFolderMenuId(
                              openFolderMenuId === folder.id ? null : folder.id
                            );
                          }}
                          className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <FaEllipsisV className="text-xs sm:text-sm" />
                        </button>

                        {openFolderMenuId === folder.id && (
                          <div
                            className={`absolute right-0 z-[60] w-44 sm:w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl ${index >= folders.length - 2 ? "bottom-10 sm:bottom-11" : "top-10 sm:top-11"
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenFolderMenuId(null);
                                navigate(`/folders/${folder.id}`, {
                                  state: { folderName: folder.name },
                                });
                              }}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                            >
                              <FaFolder className="text-sm sm:text-base" />
                              Open Folder
                            </button>

                            <button
                              type="button"
                              onClick={() => openRenameFolderModal(folder)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-orange-500 transition hover:bg-orange-50"
                            >
                              <FaEdit className="text-sm sm:text-base" />
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() => openShareFolderModal(folder)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-purple-600 transition hover:bg-purple-50"
                            >
                              <FaShareAlt className="text-sm sm:text-base" />
                              Share
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenFolderMenuId(null);
                                handleFolderDownload(folder);
                              }}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-green-600 transition hover:bg-green-50"
                            >
                              <FaDownload className="text-sm sm:text-base" />
                              Download
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              onClick={() => confirmDeleteFolder(folder)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-red-500 transition hover:bg-red-50"
                            >
                              <FaTrash className="text-sm sm:text-base" />
                              Delete Folder
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Files Section */}
            <div>
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    All Files
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Your recently uploaded files
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/files")}
                  className="text-xs sm:text-sm font-semibold text-blue-600"
                >
                  View All
                </button>
              </div>

              {recentFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center">
                  <FaCloudUploadAlt className="mx-auto mb-3 sm:mb-4 text-3xl sm:text-4xl text-slate-300" />
                  <p className="text-sm sm:text-base font-semibold text-slate-600">
                    No files found
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">
                    Upload your first file to CloudVault.
                  </p>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="mt-3 sm:mt-5 rounded-xl bg-blue-600 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white"
                  >
                    Upload File
                  </button>
                </div>
              ) : (
                <div className="relative overflow-visible rounded-2xl bg-white shadow-sm">
                  {recentFiles.map((file, index) => (
                    <div
                      key={file.id}
                      className="relative flex items-center gap-2 sm:gap-3 border-b border-slate-100 p-3 sm:p-4 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(file)}
                        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 text-left"
                      >
                        <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          {getFileIcon(file)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-semibold text-slate-700">
                            {file.original_name}
                          </p>
                          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePreviewFile(file)}
                        className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50"
                      >
                        <FaEye className="text-xs sm:text-sm" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                      >
                        <FaDownload className="text-xs sm:text-sm" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === file.id ? null : file.id
                            )
                          }
                          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                        >
                          <FaEllipsisV className="text-xs sm:text-sm" />
                        </button>

                        {openMenuId === file.id && (
                          <div
                            className={`absolute right-0 z-50 w-40 sm:w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl ${index >= recentFiles.length - 2 ? "bottom-10 sm:bottom-12" : "top-10 sm:top-12"
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handlePreviewFile(file);
                              }}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <FaEye className="text-sm sm:text-base" />
                              Open
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDownload(file);
                              }}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <FaDownload className="text-sm sm:text-base" />
                              Download
                            </button>

                            <button
                              type="button"
                              onClick={() => openRenameModal(file)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <FaEdit className="text-sm sm:text-base" />
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() => openShareModal(file)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <FaShareAlt className="text-sm sm:text-base" />
                              Share
                            </button>

                            <button
                              type="button"
                              onClick={() => confirmDeleteFile(file)}
                              className="flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm text-red-500 hover:bg-red-50"
                            >
                              <FaTrash className="text-sm sm:text-base" />
                              Move to Trash
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid h-[60px] sm:h-[70px] grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => handleSidebarClick("drive")}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-medium ${activeMenu === "drive" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <FaHome className="text-base sm:text-lg" />
            Home
          </button>

          <button
            type="button"
            onClick={() => handleSidebarClick("recent")}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-medium ${activeMenu === "recent" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <Files className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
            All Files
          </button>

          <button
            type="button"
            onClick={handleUploadClick}
            className="-mt-4 sm:-mt-8 flex flex-col items-center justify-center"
          >
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-blue-600 text-base sm:text-xl text-white shadow-lg shadow-blue-300">
              <FaPlus />
            </div>
            <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-medium text-blue-600">
              Upload
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSidebarClick("trash")}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-medium ${activeMenu === "trash" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <FaTrash className="text-base sm:text-lg" />
            Trash
          </button>

          <button
            type="button"
            onClick={openProfile}
            className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-medium text-slate-400"
          >
            <FaUserCircle className="text-base sm:text-lg" />
            Account
          </button>
        </div>
      </div>

      {/* All Modals - Responsive */}
      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xs sm:max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mb-4 sm:mb-5 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Create New Folder
              </h3>
              <button type="button" onClick={() => setShowCreateFolder(false)}>
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Folder name"
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-blue-500"
              />
              <div className="mt-4 sm:mt-5 flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-6">
          <div className="relative flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 sm:px-5 py-3 sm:py-4">
              <div className="min-w-0">
                <p className="truncate text-sm sm:text-base font-semibold text-slate-800">
                  {selectedFile.original_name}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="ml-2 sm:ml-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-2 sm:p-6">
              {previewLoading && (
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-slate-600">
                    Opening file...
                  </p>
                </div>
              )}
              {!previewLoading && previewError && (
                <div className="text-center">
                  <FaFileAlt className="mx-auto mb-3 sm:mb-4 text-4xl sm:text-5xl text-red-400" />
                  <p className="text-sm sm:text-base font-semibold text-red-500">
                    {previewError}
                  </p>
                </div>
              )}
              {!previewLoading && !previewError && previewUrl && selectedFile.mime_type?.startsWith("image/") && (
                <img src={previewUrl} alt={selectedFile.original_name} className="max-h-full max-w-full object-contain" />
              )}
              {!previewLoading && !previewError && previewUrl && selectedFile.mime_type?.startsWith("video/") && (
                <video src={previewUrl} controls className="max-h-full max-w-full" />
              )}
              {!previewLoading && !previewError && previewUrl && !selectedFile.mime_type?.startsWith("image/") && !selectedFile.mime_type?.startsWith("video/") && (
                <iframe title={selectedFile.original_name} src={previewUrl} className="h-full w-full border-0" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Modal */}
      {downloadFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-6 sm:pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3 sm:mb-4">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
                    {downloadProgress === 100 ? (
                      <FaDownload className="text-2xl sm:text-3xl text-green-600" />
                    ) : downloadProgress === 0 && !downloadFile.size ? (
                      <FaSpinner className="text-2xl sm:text-3xl text-blue-600 animate-spin" />
                    ) : (
                      <FaDownload className="text-2xl sm:text-3xl text-blue-600" />
                    )}
                  </div>
                  {downloadProgress === 100 && (
                    <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-green-500 text-white text-[8px] sm:text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {downloadProgress === 100 ? "Download Complete" : "Downloading File"}
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-slate-500 truncate max-w-[200px] sm:max-w-full">
                  {downloadProgress === 100 ? "Your file has been downloaded successfully" : downloadFile.original_name}
                </p>

                <div className="mt-3 sm:mt-4 w-full">
                  <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500">
                      {downloadFile.size ? formatBytes(downloadFile.size) : "Preparing..."}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {downloadProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${downloadProgress}%`,
                        background: downloadProgress === 100
                          ? "linear-gradient(to right, #22c55e, #16a34a)"
                          : "linear-gradient(to right, #3b82f6, #2563eb)",
                      }}
                    />
                  </div>
                </div>

                {downloadProgress < 100 && (
                  <div className="mt-3 sm:mt-5 w-full">
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                      <span>Downloading...</span>
                      <span className="animate-pulse">⏳</span>
                    </div>
                  </div>
                )}

                {downloadProgress === 100 && (
                  <div className="mt-3 sm:mt-5 w-full">
                    <div className="flex justify-center text-[10px] sm:text-xs text-green-600 font-medium">
                      ✓ Done
                    </div>
                  </div>
                )}

                {downloadProgress < 100 && (
                  <button
                    type="button"
                    onClick={cancelDownload}
                    className="mt-4 sm:mt-6 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-95"
                  >
                    Cancel Download
                  </button>
                )}

                {downloadProgress === 100 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadFile(null);
                      setDownloadProgress(0);
                    }}
                    className="mt-4 sm:mt-6 w-full rounded-xl bg-blue-600 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0">
          <div className="w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-6 sm:pt-7 text-center">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-100 text-base sm:text-xl text-red-500">
                <FaTrash />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Move to Trash?
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">
                Are you sure you want to move
                <br />
                <span className="block max-w-[180px] sm:max-w-[200px] mx-auto truncate font-semibold text-slate-700" title={fileToDelete.original_name}>
                  {fileToDelete.original_name}
                </span>
                <br />
                to Trash?
              </p>
            </div>
            <div className="border-t border-slate-200">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteFile}
                className="flex w-full items-center justify-center py-3 sm:py-4 text-sm sm:text-base font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Move to Trash"}
              </button>
              <div className="border-t border-slate-200" />
              <button
                type="button"
                disabled={deleting}
                onClick={() => setFileToDelete(null)}
                className="flex w-full items-center justify-center py-3 sm:py-4 text-sm sm:text-base font-semibold text-blue-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renamingFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs sm:max-w-md rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mb-4 sm:mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FaEdit className="text-sm sm:text-base" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Rename File
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Enter a new file name
                </p>
              </div>
            </div>
            <form onSubmit={handleRenameFile}>
              <input
                autoFocus
                value={newFileName}
                onChange={(event) => setNewFileName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <div className="mt-4 sm:mt-5 flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRenamingFile(null);
                    setNewFileName("");
                  }}
                  className="rounded-xl px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  className="rounded-xl bg-blue-600 px-4 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
                >
                  {renaming ? "Saving..." : "Rename"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Rename Modal */}
      {renamingFolder && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs sm:max-w-md rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mb-4 sm:mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                <FaEdit className="text-sm sm:text-base" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Rename Folder
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Enter a new folder name
                </p>
              </div>
            </div>
            <form onSubmit={handleRenameFolder}>
              <input
                autoFocus
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
              <div className="mt-4 sm:mt-5 flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRenamingFolder(null);
                    setNewFolderName("");
                  }}
                  className="rounded-xl px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFolderRename}
                  className="rounded-xl bg-orange-500 px-4 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {savingFolderRename ? "Saving..." : "Rename"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Delete Confirmation Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0">
          <div className="w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-6 sm:pt-7 text-center">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-100 text-base sm:text-xl text-red-500">
                <FaTrash />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Delete Folder?
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">
                Are you sure you want to delete
                <br />
                <span className="block max-w-[180px] sm:max-w-[200px] mx-auto truncate font-semibold text-slate-700" title={folderToDelete.name}>
                  {folderToDelete.name}
                </span>
                <br />
                and its contents?
              </p>
            </div>
            <div className="border-t border-slate-200">
              <button
                type="button"
                disabled={deletingFolder}
                onClick={handleDeleteFolder}
                className="flex w-full items-center justify-center py-3 sm:py-4 text-sm sm:text-base font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deletingFolder ? "Deleting..." : "Delete Folder"}
              </button>
              <div className="border-t border-slate-200" />
              <button
                type="button"
                disabled={deletingFolder}
                onClick={() => setFolderToDelete(null)}
                className="flex w-full items-center justify-center py-3 sm:py-4 text-sm sm:text-base font-semibold text-blue-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Download Progress Modal */}
      {downloadingFolder && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mb-3 sm:mb-5 flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <FaDownload className="text-base sm:text-lg" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                  Downloading Folder
                </h3>
                <p className="truncate text-[10px] sm:text-xs text-slate-500">
                  {downloadingFolder.name}
                </p>
              </div>
            </div>
            <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Download progress
              </span>
              <span className="text-xs sm:text-sm font-bold text-green-600">
                {folderDownloadProgress}%
              </span>
            </div>
            <div className="h-1.5 sm:h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-green-600 transition-all duration-300"
                style={{ width: `${folderDownloadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {(sharingFile || sharingFolder) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-sm sm:max-w-lg flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <FaShareAlt className="text-sm sm:text-base" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    Share {sharingFolder ? "Folder" : "File"}
                  </h3>
                  <p className="truncate text-[10px] sm:text-xs text-slate-500">
                    {sharingFolder ? sharingFolder.name : sharingFile?.original_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeShareModal}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
              {loadingShareData ? (
                <div className="flex flex-col items-center py-8 sm:py-12">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500">
                    Loading sharing settings...
                  </p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleShareWithUser} className="border-b border-slate-200 pb-4 sm:pb-6">
                    <h4 className="mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-800">
                      <FaUser className="text-blue-600 text-sm sm:text-base" />
                      Add people
                    </h4>
                    <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(event) => setShareEmail(event.target.value)}
                        placeholder="Enter user email"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <select
                        value={shareRole}
                        onChange={(event) => setShareRole(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-2 sm:px-3 py-2 sm:py-3 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        type="submit"
                        disabled={sharing || !shareEmail.trim()}
                        className="rounded-xl bg-blue-600 px-3 sm:px-5 py-2 sm:py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {sharing ? "Sharing..." : "Share"}
                      </button>
                    </div>
                  </form>

                  <div className="border-b border-slate-200 py-4 sm:py-6">
                    <div className="mb-3 sm:mb-4 flex items-center gap-2">
                      <FaLink className="text-purple-600 text-sm sm:text-base" />
                      <h4 className="text-sm sm:text-base font-semibold text-slate-800">
                        General Access
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-700">
                            Anyone with the link
                          </p>
                          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">
                            {accessType === "anyone_with_link"
                              ? "Anyone who has the link can access this item."
                              : "Only people you add can access this item."}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={updatingLinkAccess}
                          onClick={() =>
                            handleLinkAccessChange(
                              accessType === "anyone_with_link" ? "restricted" : "anyone_with_link"
                            )
                          }
                          className={`relative h-6 w-10 sm:h-7 sm:w-12 rounded-full transition ${accessType === "anyone_with_link" ? "bg-blue-600" : "bg-slate-300"
                            } ${updatingLinkAccess ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow transition-all duration-200 ${accessType === "anyone_with_link" ? "left-5 sm:left-6" : "left-1"
                              }`}
                          />
                        </button>
                      </div>
                      {accessType === "anyone_with_link" && (
                        <div className="mt-3 sm:mt-4">
                          {!shareToken ? (
                            <div className="rounded-xl bg-yellow-50 px-2 sm:px-3 py-2 sm:py-3 text-[10px] sm:text-xs text-yellow-700">
                              Share link is being generated.
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={getShareLink()}
                                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-slate-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleCopyShareLink}
                                className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                                title="Copy link"
                              >
                                <FaCopy className="text-xs sm:text-sm" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <div className="mb-3 sm:mb-4 flex items-center gap-2">
                      <FaUsers className="text-green-600 text-sm sm:text-base" />
                      <h4 className="text-sm sm:text-base font-semibold text-slate-800">
                        People with access
                      </h4>
                    </div>
                    {sharedUsers.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-3 sm:px-4 py-6 sm:py-8 text-center">
                        <FaUsers className="mx-auto mb-2 sm:mb-3 text-2xl sm:text-3xl text-slate-300" />
                        <p className="text-xs sm:text-sm font-medium text-slate-600">
                          No one else has access
                        </p>
                        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-400">
                          Share this item with a registered user.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {sharedUsers.map((sharedUser) => (
                          <div
                            key={sharedUser.id}
                            className="flex items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-slate-200 p-3 sm:p-4"
                          >
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 text-xs sm:text-sm">
                                {sharedUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs sm:text-sm font-semibold text-slate-700">
                                  {sharedUser.full_name}
                                </p>
                                <p className="truncate text-[10px] sm:text-xs text-slate-500">
                                  {sharedUser.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="rounded-full bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium capitalize text-slate-600">
                                {sharedUser.role}
                              </span>
                              <button
                                type="button"
                                disabled={removingUserId === sharedUser.id}
                                onClick={() => handleRemoveSharedUser(sharedUser.id)}
                                className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-50"
                              >
                                <FaTimes className="text-xs sm:text-sm" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FaUser className="text-sm sm:text-base" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Account Settings</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Manage your profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeProfile}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 flex-shrink-0"
              >
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex-1" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {profileSuccess && (
                <div className="mb-3 sm:mb-4 rounded-xl bg-green-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-green-700">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="mb-3 sm:mb-4 rounded-xl bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700">
                  {profileError}
                </div>
              )}

              <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4 rounded-2xl bg-slate-50 p-3 sm:p-4">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl sm:text-2xl font-bold text-blue-600">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-slate-800">{user?.full_name || "User"}</p>
                  <p className="text-xs sm:text-sm text-slate-500 break-all">{user?.email || ""}</p>
                </div>
              </div>

              {/* Edit Name Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2">
                    <FaEdit className="text-blue-500 text-sm sm:text-base" />
                    Full Name
                  </h4>
                  {!editName && (
                    <button
                      type="button"
                      onClick={() => setEditName(true)}
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editName ? (
                  <form onSubmit={handleUpdateName} className="space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter your full name"
                      autoFocus
                    />
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(false);
                          setNewFullName(user?.full_name || "");
                          setProfileError("");
                        }}
                        className="flex-1 rounded-xl border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 rounded-xl bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {profileLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-slate-700">{user?.full_name || "Not set"}</p>
                )}
              </div>

              {/* Password Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2">
                    <FaLock className="text-red-500 text-sm sm:text-base" />
                    Password
                  </h4>
                  {!editPassword && (
                    <button
                      type="button"
                      onClick={() => setEditPassword(true)}
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Change
                    </button>
                  )}
                </div>
                {editPassword ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">
                        Current Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">
                        New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Enter new password (min 8 chars)"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showPassword"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="h-3 w-3 sm:h-4 sm:w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showPassword" className="text-xs sm:text-sm text-slate-600">
                        Show passwords
                      </label>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setProfileError("");
                        }}
                        className="flex-1 rounded-xl border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex-1 rounded-xl bg-red-600 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {profileLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-slate-500">••••••••</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2 mb-1 sm:mb-2">
                  <FaEnvelope className="text-purple-500 text-sm sm:text-base" />
                  Email
                </h4>
                <p className="text-sm text-slate-700 break-all">{user?.email || ""}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  closeProfile();
                  setShowLogoutConfirm(true);
                }}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-6 sm:pt-7 text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-50 text-xl sm:text-2xl">
                ↪
              </div>
              <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-slate-800">
                Log out?
              </h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">
                Are you sure you want to log out of your CloudVault account?
              </p>
            </div>
            <div className="border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full border-b border-slate-200 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600 transition hover:bg-slate-50 active:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold text-red-500 transition hover:bg-red-50 active:bg-red-100"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
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
  FaDatabase,
  FaFileAlt,
  FaFolder,
  FaImage,
  FaStar,
  FaTrash,
  FaVideo,
  FaClock,
  FaSearch,
  FaTimes,
  FaPlus,
  FaEllipsisV,
} from "react-icons/fa";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


function Dashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

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

  const [showCreateFolder, setShowCreateFolder] =
    useState(false);

  const [folderName, setFolderName] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);


  const firstName = user?.full_name
    ? user.full_name.split(" ")[0]
    : "User";


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        filesResponse,
        foldersResponse,
        statsResponse,
      ] = await Promise.all([
        api.get("/files/"),
        api.get("/folders/"),
        api.get("/files/stats/"),
      ]);

      setFiles(filesResponse.data || []);
      setFolders(foldersResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (err) {
      console.error(err);

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


  const formatBytes = (bytes = 0) => {
    if (!bytes) {
      return "0 B";
    }

    const sizes = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return `${parseFloat(
      (
        bytes /
        Math.pow(1024, index)
      ).toFixed(1)
    )} ${sizes[index]}`;
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
    const category =
      getFileCategory(file);

    if (category === "image") {
      return (
        <FaImage className="text-lg text-purple-500" />
      );
    }

    if (category === "video") {
      return (
        <FaVideo className="text-lg text-red-500" />
      );
    }

    return (
      <FaFileAlt className="text-lg text-blue-500" />
    );
  };


  const imageCount = useMemo(() => {
    return files.filter(
      (file) =>
        getFileCategory(file) === "image"
    ).length;
  }, [files]);


  const documentCount = useMemo(() => {
    return files.filter(
      (file) =>
        getFileCategory(file) ===
        "document"
    ).length;
  }, [files]);


  const videoCount = useMemo(() => {
    return files.filter(
      (file) =>
        getFileCategory(file) === "video"
    ).length;
  }, [files]);


  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    return files.filter((file) =>
      file.original_name
        ?.toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        )
    );
  }, [files, searchQuery]);


  const recentFiles = useMemo(() => {
    return filteredFiles.slice(0, 5);
  }, [filteredFiles]);


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  const handleFileUpload = async (
    event
  ) => {
    const selected =
      event.target.files?.[0];

    if (!selected) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData =
        new FormData();

      formData.append(
        "file",
        selected
      );

      await api.post(
        "/files/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setSuccess(
        "File uploaded successfully."
      );

      await loadDashboardData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "File upload failed."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };


  const handleCreateFolder = async (
    event
  ) => {
    event.preventDefault();

    if (!folderName.trim()) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.post(
        "/folders/",
        {
          name: folderName.trim(),
          parent_id: null,
        }
      );

      setFolderName("");
      setShowCreateFolder(false);

      setSuccess(
        "Folder created successfully."
      );

      await loadDashboardData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create folder."
      );
    }
  };


  const handlePreviewFile = (
    file
  ) => {
    setSelectedFile(file);
  };


  const handleDownload = async (
    file
  ) => {
    try {
      const response =
        await api.get(
          `/files/${file.id}/download`,
          {
            responseType: "blob",
          }
        );

      const url =
        window.URL.createObjectURL(
          new Blob([response.data])
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        file.original_name
      );

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      setError(
        "Unable to download file."
      );
    }
  };


  const handleDeleteFile = async (
    file
  ) => {
    const confirmed =
      window.confirm(
        `Move "${file.original_name}" to trash?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/files/${file.id}`
      );

      setSuccess(
        "File moved to trash."
      );

      await loadDashboardData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete file."
      );
    }
  };


  const handleLogout = () => {
    logout();

    navigate("/login");
  };


  const handleSidebarClick = (
    menu
  ) => {
    setActiveMenu(menu);

    if (menu === "recent") {
      navigate("/recent");
    }

    if (menu === "starred") {
      navigate("/starred");
    }

    if (menu === "trash") {
      navigate("/trash");
    }

    if (menu === "drive") {
      navigate("/dashboard");
    }
  };


  const storageUsed =
    stats?.total_size || 0;

  const storageLimit =
    stats?.storage_limit ||
    20 * 1024 * 1024 * 1024;

  const storagePercentage =
    storageLimit > 0
      ? Math.min(
          (
            storageUsed /
            storageLimit
          ) *
            100,
          100
        )
      : 0;


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg font-semibold text-slate-600">
          Loading CloudVault...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100">

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />


      <div className="flex min-h-screen">

        <aside className="fixed left-0 top-0 flex h-screen w-[215px] flex-col border-r border-slate-200 bg-white">

          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <FaCloud className="text-sm text-white" />
            </div>

            <div>
              <h1 className="font-bold text-slate-800">
                CloudVault
              </h1>

              <p className="text-[10px] text-slate-500">
                Cloud Storage
              </p>
            </div>

          </div>


          <div className="px-3 pt-5">

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <FaCloudUploadAlt />

              {uploading
                ? "Uploading..."
                : "Upload File"}
            </button>

          </div>


          <nav className="mt-5 space-y-2 px-3">

            <button
              type="button"
              onClick={() =>
                handleSidebarClick(
                  "drive"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeMenu === "drive"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaCloud />
              My Drive
            </button>


            <button
              type="button"
              onClick={() =>
                handleSidebarClick(
                  "recent"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeMenu === "recent"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaClock />
              Recent
            </button>


            <button
              type="button"
              onClick={() =>
                handleSidebarClick(
                  "starred"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeMenu === "starred"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaStar />
              Starred
            </button>


            <button
              type="button"
              onClick={() =>
                handleSidebarClick(
                  "trash"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeMenu === "trash"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FaTrash />
              Trash
            </button>

          </nav>


          <div className="mt-auto px-3 pb-4">

            <div className="mb-4 rounded-2xl bg-slate-100 p-4">

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <FaDatabase className="text-blue-600" />

                  <span className="text-sm font-semibold text-slate-700">
                    Storage
                  </span>
                </div>

                <span className="text-[10px] text-slate-500">
                  20 GB
                </span>

              </div>


              <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${storagePercentage}%`,
                  }}
                />

              </div>


              <p className="mt-2 text-[10px] text-slate-500">
                {formatBytes(storageUsed)} of{" "}
                {formatBytes(storageLimit)} used
              </p>

            </div>


            <div className="flex items-center justify-between rounded-xl px-2 py-2">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  {firstName
                    .charAt(0)
                    .toUpperCase()}
                </div>


                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-slate-700">
                    {user?.full_name ||
                      "User"}
                  </p>

                  <p className="truncate text-[10px] text-slate-400">
                    {user?.email || ""}
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                Logout
              </button>

            </div>

          </div>

        </aside>


        <main className="ml-[215px] min-h-screen flex-1">

          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6">

            <div className="relative w-full max-w-[520px]">

              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search your files..."
                className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-200"
              />

            </div>


            <button
              type="button"
              className="ml-5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              <FaBell />
            </button>

          </header>


          <div className="mx-auto max-w-[1000px] px-6 py-6">

            {error && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                >
                  <FaTimes />
                </button>

              </div>
            )}


            {success && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">

                <span>
                  {success}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSuccess("")
                  }
                >
                  <FaTimes />
                </button>

              </div>
            )}


            <div className="mb-6 flex items-center justify-between">

              <div>

                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  CloudVault Dashboard
                </p>

                <h2 className="text-2xl font-bold text-slate-800">
                  Welcome back, {firstName} 👋
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage and organize all your files in one place.
                </p>

              </div>


              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
              >
                <FaCloudUploadAlt />

                {uploading
                  ? "Uploading..."
                  : "Upload File"}
              </button>

            </div>


            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-slate-500">
                      Total Files
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {stats?.total_files ||
                        0}
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <FaFileAlt className="text-blue-600" />
                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-slate-500">
                      Folders
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {folders.length}
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                    <FaFolder className="text-orange-500" />
                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-slate-500">
                      Images
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {imageCount}
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <FaImage className="text-purple-500" />
                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-slate-500">
                      Storage Used
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {formatBytes(
                        storageUsed
                      )}
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <FaDatabase className="text-green-600" />
                  </div>

                </div>

              </div>

            </div>


            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-base font-bold text-slate-800">
                  Quick Access
                </h3>

                <p className="text-xs text-slate-500">
                  Your important file categories
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowCreateFolder(true)
                }
                className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <FaPlus />
                New Folder
              </button>

            </div>


            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <FaFileAlt className="text-blue-600" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-700">
                      Documents
                    </p>

                    <p className="text-xs text-slate-500">
                      {documentCount} files
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                    <FaImage className="text-purple-500" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-700">
                      Images
                    </p>

                    <p className="text-xs text-slate-500">
                      {imageCount} files
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <FaVideo className="text-red-500" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-700">
                      Videos
                    </p>

                    <p className="text-xs text-slate-500">
                      {videoCount} files
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <FaFolder className="text-orange-500" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-700">
                      Folders
                    </p>

                    <p className="text-xs text-slate-500">
                      {folders.length} folders
                    </p>

                  </div>

                </div>

              </div>

            </div>


            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">

                <div>

                  <h3 className="font-bold text-slate-800">
                    Recent Files
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Files you recently uploaded
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate("/recent")
                  }
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>

              </div>


              {recentFiles.length === 0 ? (

                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

                  <FaCloud className="mb-4 text-4xl text-slate-300" />

                  <h4 className="font-semibold text-slate-700">
                    No files yet
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Upload your first file to get started.
                  </p>

                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Upload File
                  </button>

                </div>

              ) : (

                <div>

                  {recentFiles.map(
                    (file) => (

                      <div
                        key={file.id}
                        className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-b-0 transition hover:bg-slate-50"
                      >

                        <div
                          className="flex cursor-pointer items-center gap-4"
                          onClick={() =>
                            handlePreviewFile(
                              file
                            )
                          }
                        >

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            {getFileIcon(
                              file
                            )}
                          </div>


                          <div>

                            <p className="font-semibold text-slate-700">
                              {
                                file.original_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {getFileCategory(
                                file
                              ) === "image"
                                ? "Image"
                                : getFileCategory(
                                    file
                                  ) ===
                                  "video"
                                ? "Video"
                                : "File"}{" "}
                              •{" "}
                              {formatBytes(
                                file.size
                              )}
                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                file
                              )
                            }
                            className="rounded-lg px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Download
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFile(
                                file
                              )
                            }
                            className="rounded-lg px-3 py-2 text-red-500 hover:bg-red-50"
                          >
                            <FaTrash />
                          </button>


                          <FaEllipsisV className="text-slate-400" />

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </main>

      </div>


      {showCreateFolder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">

              <h3 className="text-lg font-bold text-slate-800">
                Create New Folder
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowCreateFolder(false)
                }
                className="text-slate-400 hover:text-slate-700"
              >
                <FaTimes />
              </button>

            </div>


            <form
              onSubmit={
                handleCreateFolder
              }
            >

              <input
                type="text"
                value={folderName}
                onChange={(event) =>
                  setFolderName(
                    event.target.value
                  )
                }
                placeholder="Folder name"
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />


              <div className="mt-5 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateFolder(
                      false
                    )
                  }
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Folder
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {selectedFile && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">

          <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="min-w-0">

                <p className="truncate font-semibold text-slate-800">
                  {
                    selectedFile.original_name
                  }
                </p>

                <p className="text-xs text-slate-500">
                  {formatBytes(
                    selectedFile.size
                  )}
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedFile(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>

            </div>


            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100">

              {selectedFile.mime_type?.startsWith(
                "image/"
              ) ? (

                <img
                  src={`${api.defaults.baseURL}/files/${selectedFile.id}/preview`}
                  alt={
                    selectedFile.original_name
                  }
                  className="max-h-full max-w-full object-contain"
                />

              ) : (

                <iframe
                  title={
                    selectedFile.original_name
                  }
                  src={`${api.defaults.baseURL}/files/${selectedFile.id}/preview`}
                  className="h-full w-full border-0"
                />

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Dashboard;
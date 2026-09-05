import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";
import {
  FaArrowLeft,
  FaCloud,
  FaCloudUploadAlt,
  FaCopy,
  FaDownload,
  FaEdit,
  FaEllipsisV,
  FaFileAlt,
  FaFilePdf,
  FaImage,
  FaLink,
  FaSearch,
  FaShareAlt,
  FaTimes,
  FaTrash,
  FaUserPlus,
  FaVideo,
} from "react-icons/fa";
import api, {
  getPublicShareUrl,
} from "../../services/api";


function MyFiles() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const downloadCancelRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoaded, setUploadLoaded] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [imageZoom, setImageZoom] = useState(1);

  const [shareFile, setShareFile] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [sharingData, setSharingData] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const [confirmModal, setConfirmModal] = useState(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadFile, setDownloadFile] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadLoaded, setDownloadLoaded] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);

  const [activeMenu, setActiveMenu] = useState(null);

  const [renameFile, setRenameFile] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // ========== HELPER FUNCTIONS ==========
  const isImage = (file) =>
    Boolean(file?.mime_type?.startsWith("image/"));

  const isVideo = (file) =>
    Boolean(file?.mime_type?.startsWith("video/"));

  const isPdf = (file) =>
    Boolean(
      file?.mime_type === "application/pdf" ||
      file?.original_name?.toLowerCase().endsWith(".pdf")
    );

  const isPreviewable = (file) =>
    isImage(file) || isVideo(file) || isPdf(file);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/files/");
      setFiles(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load your files."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const closeMenu = () => {
      setActiveMenu(null);
    };

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const previewItems = useMemo(
    () => {
      return files.filter(
        (file) =>
          isImage(file) ||
          isVideo(file) ||
          isPdf(file)
      );
    },
    [files]
  );

  const currentPreviewIndex = selectedFile
    ? previewItems.findIndex(
      (file) =>
        file.id === selectedFile.id
    )
    : -1;

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setSelectedFile(null);
    setPreviewLoading(false);
    setPreviewError("");
    setImageZoom(1);
  };

  const openPreview = async (file) => {
    setActiveMenu(null);

    if (!isPreviewable(file)) {
      setError("Preview is currently available only for images, videos, and PDFs.");
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewError("");
      setImageZoom(1);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");
      setSelectedFile(file);

      const response = await api.get(`/files/${file.id}/preview`, {
        responseType: "blob",
      });

      const objectUrl = URL.createObjectURL(response.data);
      setPreviewUrl(objectUrl);
    } catch (err) {
      console.error(err);
      setPreviewError(
        err.response?.data?.detail ||
        "Unable to open preview."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const openNextPreview = () => {
    if (previewItems.length === 0 || currentPreviewIndex === -1) {
      return;
    }

    const nextIndex = (currentPreviewIndex + 1) % previewItems.length;
    openPreview(previewItems[nextIndex]);
  };

  const openPreviousPreview = () => {
    if (previewItems.length === 0 || currentPreviewIndex === -1) {
      return;
    }

    const previousIndex = (currentPreviewIndex - 1 + previewItems.length) % previewItems.length;
    openPreview(previewItems[previousIndex]);
  };

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (!selectedFile) {
        return;
      }

      if (event.key === "Escape") {
        closePreview();
      }

      if (event.key === "ArrowRight") {
        openNextPreview();
      }

      if (event.key === "ArrowLeft") {
        openPreviousPreview();
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [selectedFile, previewItems, currentPreviewIndex]);

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

    if (isPdf(file)) {
      return "pdf";
    }

    return "document";
  };

  const getFileIcon = (file) => {
    const category = getFileCategory(file);

    if (category === "image") {
      return <FaImage className="text-xl text-purple-500" />;
    }

    if (category === "video") {
      return <FaVideo className="text-xl text-red-500" />;
    }

    if (category === "pdf") {
      return <FaFilePdf className="text-xl text-red-600" />;
    }

    return <FaFileAlt className="text-xl text-blue-500" />;
  };

  const filteredFiles = useMemo(
    () => {
      if (!searchQuery.trim()) {
        return files;
      }

      const query = searchQuery.toLowerCase();

      return files.filter(
        (file) =>
          file.original_name
            ?.toLowerCase()
            .includes(query)
      );
    },
    [files, searchQuery]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    try {
      setUploading(true);
      setUploadFile(selected);
      setUploadProgress(0);
      setUploadLoaded(0);
      setUploadTotal(selected.size);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selected);

      await api.post("/files/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded || 0;
          const total = progressEvent.total || selected.size || 0;

          setUploadLoaded(loaded);
          setUploadTotal(total);

          if (total > 0) {
            setUploadProgress(Math.round((loaded / total) * 100));
          }
        },
      });

      setUploadProgress(100);
      setSuccess(`"${selected.name}" uploaded successfully.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to upload file."
      );
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadFile(null);
        setUploadProgress(0);
        setUploadLoaded(0);
        setUploadTotal(0);
      }, 500);

      event.target.value = "";
    }
  };

  const openDownloadConfirmation = (file) => {
    setActiveMenu(null);
    setConfirmModal({
      type: "download",
      file,
    });
  };

  const openDeleteConfirmation = (file) => {
    setActiveMenu(null);
    setConfirmModal({
      type: "delete",
      file,
    });
  };

  const closeConfirmation = () => {
    if (downloading) {
      return;
    }

    setConfirmModal(null);
  };

  const handleDownload = async (file) => {
    setConfirmModal(null);
    setDownloadFile(file);
    setDownloadProgress(0);
    setDownloadLoaded(0);
    setDownloadTotal(Number(file.size) || 0);
    setDownloading(true);
    setError("");

    const controller = new AbortController();
    downloadCancelRef.current = controller;

    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: "blob",
        signal: controller.signal,
        onDownloadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded || 0;
          const total = progressEvent.total || Number(file.size) || 0;

          setDownloadLoaded(loaded);
          setDownloadTotal(total);

          if (total > 0) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          }
        },
      });

      setDownloadProgress(100);

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.original_name);

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setSuccess(`"${file.original_name}" downloaded successfully.`);
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        setSuccess("Download cancelled.");
      } else {
        console.error(err);
        setError("Unable to download file.");
      }
    } finally {
      setDownloading(false);
      setDownloadFile(null);
      setDownloadProgress(0);
      setDownloadLoaded(0);
      setDownloadTotal(0);
      downloadCancelRef.current = null;
    }
  };

  const cancelDownload = () => {
    if (downloadCancelRef.current) {
      downloadCancelRef.current.abort();
    }
  };

  const handleDelete = async (file) => {
    setConfirmModal(null);

    try {
      setError("");
      setSuccess("");

      await api.delete(`/files/${file.id}`);

      setFiles((previousFiles) =>
        previousFiles.filter((item) => item.id !== file.id)
      );

      if (selectedFile?.id === file.id) {
        closePreview();
      }

      if (shareFile?.id === file.id) {
        setShareFile(null);
      }

      setSuccess(`"${file.original_name}" moved to trash.`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to move file to trash."
      );
    }
  };

  const handleOpenRename = (file) => {
    setActiveMenu(null);
    setRenameFile(file);
    setRenameValue(file.original_name || "");
  };

  const closeRename = () => {
    if (renaming) {
      return;
    }

    setRenameFile(null);
    setRenameValue("");
  };

  const handleRename = async (event) => {
    event.preventDefault();

    if (!renameFile) {
      return;
    }

    const newName = renameValue.trim();

    if (!newName) {
      setError("Please enter a file name.");
      return;
    }

    if (newName === renameFile.original_name) {
      closeRename();
      return;
    }

    try {
      setRenaming(true);
      setError("");
      setSuccess("");

      let response;

      try {
        response = await api.patch(`/files/${renameFile.id}`, {
          original_name: newName,
        });
      } catch (patchError) {
        if (
          patchError.response?.status !== 404 &&
          patchError.response?.status !== 405
        ) {
          throw patchError;
        }

        try {
          response = await api.put(`/files/${renameFile.id}`, {
            original_name: newName,
          });
        } catch (putError) {
          if (
            putError.response?.status !== 404 &&
            putError.response?.status !== 405
          ) {
            throw putError;
          }

          try {
            response = await api.patch(
              `/files/${renameFile.id}/rename`,
              {
                original_name: newName,
              }
            );
          } catch (renamePatchError) {
            if (
              renamePatchError.response?.status !== 404 &&
              renamePatchError.response?.status !== 405
            ) {
              throw renamePatchError;
            }

            response = await api.put(
              `/files/${renameFile.id}/rename`,
              {
                original_name: newName,
              }
            );
          }
        }
      }

      const updatedFile =
        response.data && typeof response.data === "object"
          ? response.data
          : {
            ...renameFile,
            original_name: newName,
          };

      setFiles((previousFiles) =>
        previousFiles.map((file) =>
          file.id === renameFile.id
            ? {
              ...file,
              ...updatedFile,
              original_name:
                updatedFile.original_name || newName,
            }
            : file
        )
      );

      if (selectedFile?.id === renameFile.id) {
        setSelectedFile((previous) => ({
          ...previous,
          ...updatedFile,
          original_name:
            updatedFile.original_name || newName,
        }));
      }

      if (shareFile?.id === renameFile.id) {
        setShareFile((previous) => ({
          ...previous,
          ...updatedFile,
          original_name:
            updatedFile.original_name || newName,
        }));
      }

      setSuccess(`"${newName}" renamed successfully.`);

      setRenameFile(null);
      setRenameValue("");

      await loadData();
    } catch (err) {
      console.error("Rename error:", err);

      const status = err.response?.status;

      if (status === 404 || status === 405) {
        setError(
          "Rename endpoint is not available in the backend. Please add the rename API endpoint."
        );
      } else {
        setError(
          err.response?.data?.detail ||
          "Unable to rename file."
        );
      }
    } finally {
      setRenaming(false);
    }
  };

  const loadSharingData = async (fileId) => {
    try {
      setShareLoading(true);
      setShareError("");

      const response = await api.get(`/shares/files/${fileId}`);
      setSharingData(response.data);
    } catch (err) {
      console.error(err);
      setShareError(
        err.response?.data?.detail ||
        "Unable to load sharing information."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleOpenShare = async (file) => {
    setActiveMenu(null);
    setShareFile(file);
    setShareEmail("");
    setShareRole("viewer");
    setSharingData(null);
    setShareError("");
    setShareSuccess("");

    await loadSharingData(file.id);
  };

  const handleCloseShare = () => {
    setShareFile(null);
    setSharingData(null);
    setShareEmail("");
    setShareError("");
    setShareSuccess("");
  };

  const handleShareWithUser = async (event) => {
    event.preventDefault();

    if (!shareFile || !shareEmail.trim()) {
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setShareSuccess("");

      await api.post(`/shares/files/${shareFile.id}`, {
        email: shareEmail.trim(),
        role: shareRole,
      });

      setShareEmail("");
      setShareRole("viewer");
      setShareSuccess("File shared successfully.");
      await loadSharingData(shareFile.id);
    } catch (err) {
      console.error(err);
      setShareError(
        err.response?.data?.detail ||
        "Unable to share file."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveSharedUser = async (userId) => {
    if (!shareFile) {
      return;
    }

    const confirmed = window.confirm("Remove this user's access?");

    if (!confirmed) {
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setShareSuccess("");

      await api.delete(`/shares/files/${shareFile.id}/users/${userId}`);
      setShareSuccess("User access removed.");
      await loadSharingData(shareFile.id);
    } catch (err) {
      console.error(err);
      setShareError(
        err.response?.data?.detail ||
        "Unable to remove user access."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleLinkAccessChange = async (accessType) => {
    if (!shareFile) {
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setShareSuccess("");

      const response = await api.put(`/shares/files/${shareFile.id}/link`, {
        access_type: accessType,
      });

      setSharingData((previous) => ({
        ...previous,
        access_type: response.data.access_type,
        share_token: response.data.token,
      }));

      setShareSuccess(
        accessType === "anyone_with_link"
          ? "Anyone with the link can now access this file."
          : "Link access is now restricted."
      );
    } catch (err) {
      console.error(err);
      setShareError(
        err.response?.data?.detail ||
        "Unable to update link access."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!sharingData?.share_token) {
      return;
    }

    try {
      const shareUrl = getPublicShareUrl(sharingData.share_token);
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess("Share link copied to clipboard.");
    } catch (err) {
      console.error(err);
      setShareError("Unable to copy share link.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center">
          <FaCloud className="mb-4 animate-pulse text-5xl text-blue-600" />
          <p className="text-lg font-semibold text-slate-600">
            Loading your files...
          </p>
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

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1250px] items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              <FaArrowLeft />
            </button>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                My Files
              </h1>
              <p className="text-xs text-slate-500">
                Manage all your uploaded files
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="relative w-full max-w-[430px]">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search files..."
                className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <FaCloudUploadAlt />
              {uploading ? `${uploadProgress}%` : "Upload"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-6 py-8">

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              <FaTimes />
            </button>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            All Files
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {filteredFiles.length}{" "}
            {filteredFiles.length === 1 ? "file" : "files"}
            {" available"}
          </p>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FaCloud className="mb-5 text-6xl text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700">
              No files found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload your first file to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_100px] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div>Name</div>
              <div>Size</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[minmax(0,1fr)_140px_100px] items-center border-b border-slate-100 px-6 py-4 last:border-b-0 transition hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => openPreview(file)}
                  className="flex min-w-0 items-center gap-4 text-left"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    {getFileIcon(file)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-700">
                      {file.original_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getFileCategory(file)}
                    </p>
                  </div>
                </button>

                <div className="text-sm text-slate-500">
                  {formatBytes(file.size)}
                </div>

                <div className="relative flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenu(activeMenu === file.id ? null : file.id);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                  >
                    <FaEllipsisV />
                  </button>

                  {activeMenu === file.id && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => openPreview(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <FaFileAlt />
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenShare(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-600"
                      >
                        <FaShareAlt />
                        Share
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRename(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
                      >
                        <FaEdit />
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() => openDownloadConfirmation(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <FaDownload />
                        Download
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => openDeleteConfirmation(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Progress Modal */}
      {uploading && uploadFile && (
        <div className="fixed bottom-6 right-6 z-[300] w-[380px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <FaCloudUploadAlt className="text-xl" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    Uploading
                  </p>
                  <p className="max-w-[200px] truncate text-xs text-slate-500">
                    {uploadFile.name}
                  </p>
                </div>
              </div>

              <span className="text-xl font-bold text-blue-600">
                {uploadProgress}%
              </span>
            </div>

            <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                style={{ width: `${uploadProgress}%` }}
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {formatBytes(uploadLoaded)} of {formatBytes(uploadTotal)}
              </span>
              <span>Please wait...</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6">
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${confirmModal.type === "delete"
                  ? "bg-red-100 text-red-500"
                  : "bg-blue-100 text-blue-600"
                  }`}
              >
                {confirmModal.type === "delete" ? (
                  <FaTrash className="text-xl" />
                ) : (
                  <FaDownload className="text-xl" />
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                {confirmModal.type === "delete"
                  ? "Move file to trash?"
                  : "Download file?"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {confirmModal.type === "delete"
                  ? `Are you sure you want to move "${confirmModal.file.original_name}" to trash?`
                  : `Do you want to download "${confirmModal.file.original_name}" (${formatBytes(confirmModal.file.size)})?`}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeConfirmation}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === "delete") {
                    handleDelete(confirmModal.file);
                  } else {
                    handleDownload(confirmModal.file);
                  }
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${confirmModal.type === "delete"
                  ? "bg-red-500 shadow-red-200 hover:bg-red-600"
                  : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                  }`}
              >
                {confirmModal.type === "delete"
                  ? "Move to Trash"
                  : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameFile && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleRename} className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <FaEdit className="text-xl" />
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                Rename File
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter a new name for this file.
              </p>

              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeRename}
                disabled={renaming}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={renaming || !renameValue.trim()}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {renaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Download Progress Modal */}
      {downloading && downloadFile && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="p-7">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <FaDownload className="text-xl" />
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">
                    {downloadProgress}%
                  </p>
                  <p className="text-xs text-slate-400">
                    Downloading
                  </p>
                </div>
              </div>

              <h2 className="truncate text-lg font-bold text-slate-800">
                {downloadFile.original_name}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {formatBytes(downloadLoaded)} of{" "}
                {formatBytes(downloadTotal || downloadFile.size)}
              </p>

              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${downloadProgress}%` }}
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                />
              </div>

              <button
                type="button"
                onClick={cancelDownload}
                className="mt-7 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-500"
              >
                Cancel Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal - Updated to support PDF */}
      {selectedFile && (
        <div
          onClick={closePreview}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-xl sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-slate-900/95 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  onClick={closePreview}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white shadow-lg transition hover:scale-105"
                >
                  ×
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white sm:text-base">
                    {selectedFile.original_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>

              {/* Zoom controls only for images */}
              {isImage(selectedFile) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageZoom((previous) => Math.max(0.5, previous - 0.25))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageZoom(1)}
                    className="hidden rounded-full bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20 sm:block"
                  >
                    {Math.round(imageZoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageZoom((previous) => Math.min(3, previous + 0.25))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
              )}

              {/* PDF page counter */}
              {isPdf(selectedFile) && previewUrl && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-2 text-xs text-white">
                    PDF
                  </span>
                </div>
              )}
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/30 p-4 sm:p-8">
              {previewItems.length > 1 && (
                <button
                  type="button"
                  onClick={openPreviousPreview}
                  className="absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-2xl text-white transition hover:bg-black/70 sm:left-6"
                >
                  ‹
                </button>
              )}

              {previewLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                  <p className="text-sm text-white">
                    Loading preview...
                  </p>
                </div>
              ) : previewError ? (
                <div className="rounded-2xl bg-red-500/10 p-8 text-center text-red-300">
                  {previewError}
                </div>
              ) : previewUrl ? (
                isImage(selectedFile) ? (
                  <div className="flex h-full w-full items-center justify-center overflow-auto">
                    <img
                      src={previewUrl}
                      alt={selectedFile.original_name}
                      style={{ transform: `scale(${imageZoom})` }}
                      className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
                    />
                  </div>
                ) : isVideo(selectedFile) ? (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl"
                  />
                ) : isPdf(selectedFile) ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <iframe
                      src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      title={selectedFile.original_name}
                      className="h-full w-full rounded-2xl bg-white"
                      style={{ border: 'none' }}
                    />
                  </div>
                ) : null
              ) : null}

              {previewItems.length > 1 && (
                <button
                  type="button"
                  onClick={openNextPreview}
                  className="absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-2xl text-white transition hover:bg-black/70 sm:right-6"
                >
                  ›
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-400">
              <span>
                {currentPreviewIndex >= 0
                  ? `${currentPreviewIndex + 1} of ${previewItems.length}`
                  : ""}
              </span>
              <span className="hidden sm:block">
                ← → Navigate &nbsp; • &nbsp; ESC Close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareFile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Share File
                </h2>
                <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                  {shareFile.original_name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseShare}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {shareError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {shareError}
                </div>
              )}

              {shareSuccess && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                  {shareSuccess}
                </div>
              )}

              <form onSubmit={handleShareWithUser} className="mb-8">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Add people
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(event) => setShareEmail(event.target.value)}
                      placeholder="Enter registered user email"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <select
                    value={shareRole}
                    onChange={(event) => setShareRole(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>

                  <button
                    type="submit"
                    disabled={shareLoading}
                    className="rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <FaLink className="text-blue-600" />
                  <h3 className="font-semibold text-slate-800">
                    General access
                  </h3>
                </div>

                <div className="rounded-xl border border-slate-200">
                  <button
                    type="button"
                    disabled={shareLoading}
                    onClick={() => handleLinkAccessChange("restricted")}
                    className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-4 text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">
                        Restricted
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Only people you add can access this file.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={shareLoading}
                    onClick={() => handleLinkAccessChange("anyone_with_link")}
                    className="flex w-full items-center justify-between px-4 py-4 text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">
                        Anyone with the link
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Anyone with the link can open this file.
                      </p>
                    </div>
                  </button>
                </div>

                {sharingData?.access_type === "anyone_with_link" && sharingData?.share_token && (
                  <div className="mt-4 flex gap-2">
                    <input
                      readOnly
                      value={getPublicShareUrl(sharingData.share_token)}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      <FaCopy />
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  People with access
                </h3>

                {sharingData?.shared_users?.length ? (
                  <div className="space-y-2">
                    {sharingData.shared_users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-700">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>

                        <div className="ml-4 flex items-center gap-3">
                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                            {user.role}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveSharedUser(user.id)}
                            className="text-xs font-semibold text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      This file has not been shared with anyone yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MyFiles;
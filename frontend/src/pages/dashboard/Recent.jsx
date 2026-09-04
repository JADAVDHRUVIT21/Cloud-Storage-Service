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
  FaDownload,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaFileAlt,
  FaImage,
  FaLink,
  FaSearch,
  FaShareAlt,
  FaTimes,
  FaTrash,
  FaUser,
  FaVideo,
} from "react-icons/fa";

import api from "../../services/api";


function Recent() {

  const navigate = useNavigate();

  const menuRef = useRef(null);

  const [files, setFiles] = useState([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [previewError, setPreviewError] =
    useState("");

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [fileToDelete, setFileToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [renamingFile, setRenamingFile] =
    useState(null);

  const [newFileName, setNewFileName] =
    useState("");

  const [renaming, setRenaming] =
    useState(false);

  const [sharingFile, setSharingFile] =
    useState(null);

  const [shareEmail, setShareEmail] =
    useState("");

  const [shareRole, setShareRole] =
    useState("viewer");

  const [sharedUsers, setSharedUsers] =
    useState([]);

  const [loadingShareData, setLoadingShareData] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [removingUserId, setRemovingUserId] =
    useState(null);

  const [accessType, setAccessType] =
    useState("restricted");

  const [shareToken, setShareToken] =
    useState(null);

  const [updatingLinkAccess, setUpdatingLinkAccess] =
    useState(false);


  const loadFiles = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get("/files/");

      setFiles(
        response.data || []
      );

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load recent files."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadFiles();

  }, []);


  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {

          setOpenMenuId(null);

        }

      };


    if (openMenuId !== null) {

      document.addEventListener(
        "mousedown",
        handleClickOutside
      );

    }


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, [openMenuId]);


  useEffect(() => {

    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {

        setSuccess("");

      }, 3000);


    return () =>
      clearTimeout(timer);

  }, [success]);


  useEffect(() => {

    if (!error) {
      return;
    }

    const timer =
      setTimeout(() => {

        setError("");

      }, 5000);


    return () =>
      clearTimeout(timer);

  }, [error]);


  useEffect(() => {

    return () => {

      if (previewUrl) {

        window.URL.revokeObjectURL(
          previewUrl
        );

      }

    };

  }, [previewUrl]);


  const formatBytes =
    (bytes = 0) => {

      if (!bytes || bytes === 0) {

        return "0 B";

      }

      const sizes = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB",
      ];

      const index =
        Math.floor(
          Math.log(bytes) /
          Math.log(1024)
        );

      return `${parseFloat(
        (
          bytes /
          Math.pow(1024, index)
        ).toFixed(1)
      )} ${sizes[index]}`;

    };


  const getFileCategory =
    (file) => {

      const type =
        file.mime_type || "";

      if (
        type.startsWith("image/")
      ) {

        return "image";

      }

      if (
        type.startsWith("video/")
      ) {

        return "video";

      }

      if (
        type.startsWith("audio/")
      ) {

        return "audio";

      }

      return "document";

    };


  const getFileIcon =
    (file) => {

      const category =
        getFileCategory(file);

      if (
        category === "image"
      ) {

        return (
          <FaImage className="text-lg text-purple-500" />
        );

      }

      if (
        category === "video"
      ) {

        return (
          <FaVideo className="text-lg text-red-500" />
        );

      }

      return (
        <FaFileAlt className="text-lg text-blue-500" />
      );

    };


  const getFileLabel =
    (file) => {

      const category =
        getFileCategory(file);

      if (
        category === "image"
      ) {

        return "Image";

      }

      if (
        category === "video"
      ) {

        return "Video";

      }

      if (
        category === "audio"
      ) {

        return "Audio";

      }

      return "Document";

    };


  const filteredFiles =
    useMemo(() => {

      if (
        !searchQuery.trim()
      ) {

        return files;

      }

      return files.filter(
        (file) =>
          file.original_name
            ?.toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            )
      );

    }, [
      files,
      searchQuery,
    ]);


  const handlePreviewFile =
    async (file) => {

      try {

        setOpenMenuId(null);

        setSelectedFile(file);

        setPreviewLoading(true);

        setPreviewError("");

        if (previewUrl) {

          window.URL.revokeObjectURL(
            previewUrl
          );

        }

        setPreviewUrl("");

        const response =
          await api.get(
            `/files/${file.id}/preview`,
            {
              responseType: "blob",
            }
          );

        const url =
          window.URL.createObjectURL(
            new Blob(
              [response.data],
              {
                type:
                  file.mime_type ||
                  "application/octet-stream",
              }
            )
          );

        setPreviewUrl(url);

      } catch (err) {

        console.error(err);

        setPreviewError(
          err.response?.data?.detail ||
          "Unable to open this file."
        );

      } finally {

        setPreviewLoading(false);

      }

    };


  const closePreview =
    () => {

      if (previewUrl) {

        window.URL.revokeObjectURL(
          previewUrl
        );

      }

      setPreviewUrl("");

      setSelectedFile(null);

      setPreviewError("");

    };


  const handleDownload =
    async (file) => {

      try {

        setOpenMenuId(null);

        const response =
          await api.get(
            `/files/${file.id}/download`,
            {
              responseType: "blob",
            }
          );

        const url =
          window.URL.createObjectURL(
            new Blob([
              response.data,
            ])
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

        setSuccess(
          "Download started."
        );

      } catch (err) {

        console.error(err);

        setError(
          "Unable to download file."
        );

      }

    };


  const confirmDelete =
    (file) => {

      setOpenMenuId(null);

      setFileToDelete(file);

    };


  const handleDelete =
    async () => {

      if (!fileToDelete) {

        return;

      }

      try {

        setDeleting(true);

        await api.delete(
          `/files/${fileToDelete.id}`
        );

        setFiles(
          (previousFiles) =>
            previousFiles.filter(
              (item) =>
                item.id !==
                fileToDelete.id
            )
        );

        if (
          selectedFile?.id ===
          fileToDelete.id
        ) {

          closePreview();

        }

        setSuccess(
          `"${fileToDelete.original_name}" moved to Trash.`
        );

        setFileToDelete(null);

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Unable to move file to trash."
        );

      } finally {

        setDeleting(false);

      }

    };


  const openRenameModal =
    (file) => {

      setOpenMenuId(null);

      setRenamingFile(file);

      setNewFileName(
        file.original_name
      );

    };


  const handleRename =
    async (event) => {

      event.preventDefault();

      if (
        !renamingFile ||
        !newFileName.trim()
      ) {

        return;

      }

      try {

        setRenaming(true);

        const response =
          await api.put(
            `/files/${renamingFile.id}/rename`,
            {
              original_name:
                newFileName.trim(),
            }
          );

        setFiles(
          (previousFiles) =>
            previousFiles.map(
              (file) =>
                file.id ===
                renamingFile.id
                  ? {
                      ...file,
                      ...response.data,
                    }
                  : file
            )
        );

        if (
          selectedFile?.id ===
          renamingFile.id
        ) {

          setSelectedFile(
            response.data
          );

        }

        setSuccess(
          "File renamed successfully."
        );

        setRenamingFile(null);

        setNewFileName("");

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Unable to rename file."
        );

      } finally {

        setRenaming(false);

      }

    };


  const openShareModal =
    async (file) => {

      setOpenMenuId(null);

      setSharingFile(file);

      setShareEmail("");

      setShareRole("viewer");

      setSharedUsers([]);

      setAccessType(
        "restricted"
      );

      setShareToken(null);

      setLoadingShareData(true);

      try {

        const response =
          await api.get(
            `/shares/files/${file.id}`
          );

        setSharedUsers(
          response.data
            ?.shared_users || []
        );

        setAccessType(
          response.data
            ?.access_type ||
          "restricted"
        );

        setShareToken(
          response.data
            ?.share_token ||
          null
        );

      } catch (err) {

        console.error(err);

        if (
          err.response?.status !==
          404
        ) {

          setError(
            err.response?.data?.detail ||
            "Unable to load sharing information."
          );

        }

      } finally {

        setLoadingShareData(false);

      }

    };


  const closeShareModal =
    () => {

      setSharingFile(null);

      setShareEmail("");

      setSharedUsers([]);

      setShareRole("viewer");

      setAccessType(
        "restricted"
      );

      setShareToken(null);

    };


  const handleShareWithUser =
    async (event) => {

      event.preventDefault();

      if (
        !sharingFile ||
        !shareEmail.trim()
      ) {

        return;

      }

      try {

        setSharing(true);

        const response =
          await api.post(
            `/shares/files/${sharingFile.id}`,
            {
              email:
                shareEmail.trim(),
              role:
                shareRole,
            }
          );

        setSharedUsers(
          (previous) => [
            response.data,
            ...previous,
          ]
        );

        setShareEmail("");

        setSuccess(
          "File shared successfully."
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Unable to share file."
        );

      } finally {

        setSharing(false);

      }

    };


  const handleRemoveSharedUser =
    async (userId) => {

      if (!sharingFile) {

        return;

      }

      try {

        setRemovingUserId(
          userId
        );

        await api.delete(
          `/shares/files/${sharingFile.id}/users/${userId}`
        );

        setSharedUsers(
          (previous) =>
            previous.filter(
              (user) =>
                user.id !==
                userId
            )
        );

        setSuccess(
          "User access removed."
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Unable to remove user."
        );

      } finally {

        setRemovingUserId(
          null
        );

      }

    };


  const handleLinkAccessChange =
    async () => {

      if (!sharingFile) {

        return;

      }

      const newAccessType =
        accessType ===
        "anyone_with_link"
          ? "restricted"
          : "anyone_with_link";

      try {

        setUpdatingLinkAccess(
          true
        );

        const response =
          await api.put(
            `/shares/files/${sharingFile.id}/link`,
            {
              access_type:
                newAccessType,
            }
          );

        setAccessType(
          response.data.access_type
        );

        setShareToken(
          response.data.token
        );

        setSuccess(
          newAccessType ===
            "anyone_with_link"
            ? "Anyone with the link can now access this file."
            : "Link access restricted."
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Unable to update link access."
        );

      } finally {

        setUpdatingLinkAccess(
          false
        );

      }

    };


  const getShareLink =
    () => {

      if (!shareToken) {

        return "";

      }

      return `${window.location.origin}/shared/${shareToken}`;

    };


  const handleCopyShareLink =
    async () => {

      const link =
        getShareLink();

      if (!link) {

        return;

      }

      try {

        await navigator.clipboard.writeText(
          link
        );

        setSuccess(
          "Share link copied to clipboard."
        );

      } catch (err) {

        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value =
          link;

        document.body.appendChild(
          textArea
        );

        textArea.select();

        document.execCommand(
          "copy"
        );

        textArea.remove();

        setSuccess(
          "Share link copied to clipboard."
        );

      }

    };


  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">

        <div className="flex flex-col items-center">

          <FaCloud className="mb-4 animate-pulse text-5xl text-blue-600" />

          <p className="text-lg font-semibold text-slate-600">
            Loading recent files...
          </p>

        </div>

      </div>
    );

  }


  return (

    <div className="min-h-screen bg-slate-100">

      {success && (

        <div className="fixed right-4 top-4 z-[200] max-w-sm rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {success}
        </div>

      )}


      {error && (

        <div className="fixed right-4 top-4 z-[200] flex max-w-sm items-center gap-4 rounded-xl bg-red-500 px-5 py-3 text-sm font-medium text-white shadow-xl">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto"
          >
            <FaTimes />
          </button>

        </div>

      )}


      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">

        <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              <FaArrowLeft />
            </button>


            <div className="min-w-0">

              <h1 className="truncate text-xl font-bold text-slate-800">
                Recent Files
              </h1>

              <p className="text-xs text-slate-500">
                Your recently uploaded files
              </p>

            </div>

          </div>


          <div className="relative hidden w-full max-w-[420px] sm:block">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search recent files..."
              className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
            />

          </div>

        </div>


        <div className="border-t border-slate-100 px-4 py-3 sm:hidden">

          <div className="relative">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search recent files..."
              className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
            />

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Recent Files
          </h2>

          <p className="mt-1 text-sm text-slate-500">

            {filteredFiles.length}{" "}

            {filteredFiles.length === 1
              ? "file"
              : "files"}{" "}

            available

          </p>

        </div>


        {filteredFiles.length === 0 ? (

          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <FaCloud className="mb-5 text-6xl text-slate-300" />

            <h3 className="text-lg font-bold text-slate-700">
              No recent files found
            </h3>

            <p className="mt-2 text-sm text-slate-500">

              {searchQuery
                ? "Try searching for a different file."
                : "Upload files from your dashboard to see them here."}

            </p>


            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Dashboard
            </button>

          </div>

        ) : (

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            {filteredFiles.map(
              (file) => (

                <div
                  key={file.id}
                  className="relative flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-6"
                >

                  <button
                    type="button"
                    onClick={() =>
                      handlePreviewFile(file)
                    }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >

                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">

                      {getFileIcon(file)}

                    </div>


                    <div className="min-w-0">

                      <p className="truncate font-semibold text-slate-700">
                        {file.original_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">

                        {getFileLabel(file)}

                        {" • "}

                        {formatBytes(
                          file.size
                        )}

                      </p>

                    </div>

                  </button>


                  <div className="relative ml-2 flex flex-shrink-0 items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewFile(file)
                      }
                      className="hidden h-10 w-10 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-50 sm:flex"
                      title="Open"
                    >
                      <FaEye />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(file)
                      }
                      className="hidden h-10 w-10 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-50 sm:flex"
                      title="Download"
                    >
                      <FaDownload />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === file.id
                            ? null
                            : file.id
                        )
                      }
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        openMenuId === file.id
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                      title="More options"
                    >
                      <FaEllipsisV />
                    </button>


                    {openMenuId ===
                      file.id && (

                      <div
                        ref={menuRef}
                        className="absolute right-0 top-12 z-[100] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handlePreviewFile(
                              file
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaEye />
                          Open
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              file
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaDownload />
                          Download
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            openRenameModal(
                              file
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaEdit />
                          Rename
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            openShareModal(
                              file
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaShareAlt />
                          Share
                        </button>


                        <div className="my-1 border-t border-slate-100" />


                        <button
                          type="button"
                          onClick={() =>
                            confirmDelete(
                              file
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
                        >
                          <FaTrash />
                          Move to Trash
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </main>


      {selectedFile && (

        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6">

          <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">

              <div className="min-w-0">

                <p className="truncate font-semibold text-slate-800">
                  {selectedFile.original_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatBytes(
                    selectedFile.size
                  )}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closePreview
                }
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>

            </div>


            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100">

              {previewLoading && (

                <div className="flex flex-col items-center gap-4">

                  <FaCloud className="animate-pulse text-5xl text-blue-600" />

                  <p className="font-medium text-slate-600">
                    Opening file...
                  </p>

                </div>

              )}


              {previewError && (

                <div className="p-8 text-center">

                  <FaFileAlt className="mx-auto mb-4 text-5xl text-slate-300" />

                  <p className="font-semibold text-red-500">
                    {previewError}
                  </p>

                </div>

              )}


              {!previewLoading &&
                !previewError &&
                previewUrl && (

                  selectedFile.mime_type?.startsWith(
                    "image/"
                  ) ? (

                    <img
                      src={previewUrl}
                      alt={
                        selectedFile.original_name
                      }
                      className="max-h-full max-w-full object-contain"
                    />

                  ) : selectedFile.mime_type?.startsWith(
                    "video/"
                  ) ? (

                    <video
                      src={previewUrl}
                      controls
                      autoPlay
                      className="max-h-full max-w-full"
                    />

                  ) : selectedFile.mime_type?.startsWith(
                    "audio/"
                  ) ? (

                    <audio
                      src={previewUrl}
                      controls
                      className="w-full max-w-xl"
                    />

                  ) : (

                    <iframe
                      title={
                        selectedFile.original_name
                      }
                      src={previewUrl}
                      className="h-full w-full border-0"
                    />

                  )

                )}

            </div>

          </div>

        </div>

      )}


      {fileToDelete && (

        <div className="fixed inset-0 z-[170] flex items-end justify-center bg-black/40 p-4 sm:items-center">

          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">

            <div className="p-6 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

                <FaTrash className="text-xl text-red-500" />

              </div>


              <h3 className="text-xl font-bold text-slate-800">
                Move to Trash?
              </h3>


              <p className="mt-3 break-words text-sm leading-6 text-slate-500">

                Are you sure you want to move

                <br />

                <span className="font-semibold text-slate-700">
                  "{fileToDelete.original_name}"
                </span>

                <br />

                to Trash?

              </p>

            </div>


            <div className="border-t border-slate-200">

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex w-full items-center justify-center border-b border-slate-200 py-4 font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
              >
                {deleting
                  ? "Moving..."
                  : "Move to Trash"}
              </button>


              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setFileToDelete(null)
                }
                className="w-full py-4 font-semibold text-blue-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}


      {renamingFile && (

        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4">

          <form
            onSubmit={
              handleRename
            }
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold text-slate-800">
                  Rename File
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enter a new name for your file.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {

                  setRenamingFile(
                    null
                  );

                  setNewFileName(
                    ""
                  );

                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <FaTimes />
              </button>

            </div>


            <input
              type="text"
              autoFocus
              value={
                newFileName
              }
              onChange={(event) =>
                setNewFileName(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
            />


            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setRenamingFile(
                    null
                  )
                }
                className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  renaming ||
                  !newFileName.trim()
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {renaming
                  ? "Saving..."
                  : "Save Name"}
              </button>

            </div>

          </form>

        </div>

      )}


      {sharingFile && (

        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4">

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div className="min-w-0">

                <h3 className="truncate text-xl font-bold text-slate-800">
                  Share File
                </h3>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {sharingFile.original_name}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeShareModal
                }
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <FaTimes />
              </button>

            </div>


            <div className="overflow-y-auto p-6">

              {loadingShareData ? (

                <div className="py-10 text-center text-slate-500">
                  Loading sharing information...
                </div>

              ) : (

                <>

                  <form
                    onSubmit={
                      handleShareWithUser
                    }
                    className="rounded-2xl border border-slate-200 p-4"
                  >

                    <div className="mb-4 flex items-center gap-2">

                      <FaUser className="text-blue-600" />

                      <h4 className="font-semibold text-slate-800">
                        Add People
                      </h4>

                    </div>


                    <div className="flex flex-col gap-3 sm:flex-row">

                      <input
                        type="email"
                        value={
                          shareEmail
                        }
                        onChange={(event) =>
                          setShareEmail(
                            event.target.value
                          )
                        }
                        placeholder="Enter email address"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />


                      <select
                        value={
                          shareRole
                        }
                        onChange={(event) =>
                          setShareRole(
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                      >
                        <option value="viewer">
                          Viewer
                        </option>

                        <option value="editor">
                          Editor
                        </option>
                      </select>


                      <button
                        type="submit"
                        disabled={
                          sharing ||
                          !shareEmail.trim()
                        }
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {sharing
                          ? "Sharing..."
                          : "Share"}
                      </button>

                    </div>

                  </form>


                  <div className="border-b border-slate-200 py-6">

                    <div className="mb-4 flex items-center gap-2">

                      <FaLink className="text-purple-600" />

                      <h4 className="font-semibold text-slate-800">
                        General Access
                      </h4>

                    </div>


                    <div className="rounded-2xl border border-slate-200 p-4">

                      <div className="flex items-center justify-between gap-4">

                        <div>

                          <p className="font-medium text-slate-700">
                            Anyone with the link
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Anyone who has the link can access this file.
                          </p>

                        </div>


                        <button
                          type="button"
                          disabled={
                            updatingLinkAccess
                          }
                          onClick={
                            handleLinkAccessChange
                          }
                          className={`relative h-7 w-12 rounded-full transition ${
                            accessType ===
                            "anyone_with_link"
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >

                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                              accessType ===
                              "anyone_with_link"
                                ? "left-6"
                                : "left-1"
                            }`}
                          />

                        </button>

                      </div>


                      {accessType ===
                        "anyone_with_link" &&
                        shareToken && (

                          <div className="mt-4 flex gap-2">

                            <input
                              readOnly
                              value={
                                getShareLink()
                              }
                              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 outline-none"
                            />


                            <button
                              type="button"
                              onClick={
                                handleCopyShareLink
                              }
                              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                            >
                              Copy
                            </button>

                          </div>

                        )}

                    </div>

                  </div>


                  <div className="pt-6">

                    <h4 className="mb-4 font-semibold text-slate-800">
                      People with Access
                    </h4>


                    {sharedUsers.length ===
                    0 ? (

                      <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                        No additional users have access yet.
                      </div>

                    ) : (

                      <div className="space-y-3">

                        {sharedUsers.map(
                          (user) => (

                            <div
                              key={
                                user.id
                              }
                              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                            >

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-slate-700">

                                  {user.full_name ||
                                    user.name ||
                                    user.email}

                                </p>


                                <p className="truncate text-xs text-slate-500">

                                  {user.email}

                                  {user.role &&
                                    ` • ${user.role}`}

                                </p>

                              </div>


                              <button
                                type="button"
                                disabled={
                                  removingUserId ===
                                  user.id
                                }
                                onClick={() =>
                                  handleRemoveSharedUser(
                                    user.id
                                  )
                                }
                                className="flex-shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                              >
                                {removingUserId ===
                                user.id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default Recent;
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    FaArrowLeft,
    FaCheck,
    FaCloud,
    FaCloudUploadAlt,
    FaDownload,
    FaEllipsisV,
    FaFileAlt,
    FaFolder,
    FaImage,
    FaMusic,
    FaPencilAlt,
    FaShareAlt,
    FaTimes,
    FaTrash,
    FaVideo,
    FaExternalLinkAlt,
    FaChevronLeft,
    FaChevronRight,
    FaPlus,
    FaMinus,
    FaExpand,
    FaCompress,
} from "react-icons/fa";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import api, {
    getPublicShareUrl,
} from "../../services/api";


function Folder() {
    const navigate = useNavigate();

    const location = useLocation();

    const { folderId } = useParams();

    const fileInputRef = useRef(null);

    const menuRef = useRef(null);

    const downloadAbortRef = useRef(null);

    const previewUrlRef = useRef(null);

    const [folderName] = useState(
        location.state?.folderName || "Folder"
    );

    const [files, setFiles] = useState([]);

    const [loading, setLoading] = useState(true);

    const [dragActive, setDragActive] = useState(false);

    const [uploading, setUploading] = useState(false);

    const [uploadProgress, setUploadProgress] = useState(0);

    const [uploadingFileName, setUploadingFileName] = useState("");

    const [uploadedBytes, setUploadedBytes] = useState(0);

    const [totalBytes, setTotalBytes] = useState(0);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [activeMenuId, setActiveMenuId] = useState(null);

    const [previewFile, setPreviewFile] = useState(null);

    const [previewUrl, setPreviewUrl] = useState("");

    const [previewLoading, setPreviewLoading] = useState(false);

    const [previewError, setPreviewError] = useState("");

    const [imageZoom, setImageZoom] = useState(1);

    const [renameFile, setRenameFile] = useState(null);

    const [renameValue, setRenameValue] = useState("");

    const [actionLoading, setActionLoading] = useState(false);

    const [deleteFile, setDeleteFile] = useState(null);

    const [deleteLoading, setDeleteLoading] = useState(false);

    const [downloadConfirmFile, setDownloadConfirmFile] = useState(null);

    const [downloadingFile, setDownloadingFile] = useState(null);

    const [downloading, setDownloading] = useState(false);

    const [downloadProgress, setDownloadProgress] = useState(0);

    const [downloadedBytes, setDownloadedBytes] = useState(0);

    const [downloadTotalBytes, setDownloadTotalBytes] = useState(0);

    // Preview navigation
    const previewItems = useMemo(
        () => {
            return files.filter(
                (file) =>
                    file?.mime_type?.startsWith("image/") ||
                    file?.mime_type?.startsWith("video/")
            );
        },
        [files]
    );

    const currentPreviewIndex = previewFile
        ? previewItems.findIndex(
            (file) =>
                file.id === previewFile.id
        )
        : -1;

    const formatBytes = (bytes = 0) => {
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

        const index = Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

        const value =
            bytes /
            Math.pow(1024, index);

        return `${parseFloat(
            value.toFixed(1)
        )} ${sizes[index]}`;
    };

    const getErrorMessage = (
        errorResponse
    ) => {
        const detail =
            errorResponse?.response?.data?.detail;

        if (typeof detail === "string") {
            return detail;
        }

        if (Array.isArray(detail)) {
            return detail
                .map((item) => {
                    if (
                        typeof item === "string"
                    ) {
                        return item;
                    }

                    if (item?.msg) {
                        return item.msg;
                    }

                    if (item?.loc) {
                        return `${item.loc.join(
                            "."
                        )}: ${item.msg || "Validation error"}`;
                    }

                    return "Validation error";
                })
                .join(", ");
        }

        if (
            detail &&
            typeof detail === "object"
        ) {
            return (
                detail.msg ||
                "Unable to complete request."
            );
        }

        return (
            errorResponse?.message ||
            "Unable to complete request."
        );
    };

    const getFileIcon = (file) => {
        const type =
            file.mime_type ||
            file.type ||
            "";

        if (
            type.startsWith("image/")
        ) {
            return (
                <FaImage className="text-xl text-purple-500" />
            );
        }

        if (
            type.startsWith("video/")
        ) {
            return (
                <FaVideo className="text-xl text-red-500" />
            );
        }

        if (
            type.startsWith("audio/")
        ) {
            return (
                <FaMusic className="text-xl text-pink-500" />
            );
        }

        return (
            <FaFileAlt className="text-xl text-blue-500" />
        );
    };

    const isImage = (file) =>
        Boolean(
            file?.mime_type?.startsWith("image/")
        );

    const isVideo = (file) =>
        Boolean(
            file?.mime_type?.startsWith("video/")
        );

    const loadFolderFiles = async () => {
        if (!folderId) {
            setFiles([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    `/files/folder/${folderId}`
                );

            setFiles(
                response.data || []
            );

        } catch (err) {
            console.error(
                "Folder load error:",
                err
            );

            setError(
                getErrorMessage(err)
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolderFiles();
    }, [folderId]);

    useEffect(() => {
        if (!success) {
            return;
        }

        const timer =
            setTimeout(() => {
                setSuccess("");
            }, 3500);

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
        const handleClickOutside = (
            event
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target
                )
            ) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    useEffect(() => {
        const handleKeyDown = (
            event
        ) => {
            if (
                event.key === "Escape" &&
                previewFile
            ) {
                closePreview();
            }

            if (
                event.key === "ArrowRight" &&
                previewFile
            ) {
                openNextPreview();
            }

            if (
                event.key === "ArrowLeft" &&
                previewFile
            ) {
                openPreviousPreview();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [previewFile, previewUrl, previewItems, currentPreviewIndex]);

    useEffect(() => {
        return () => {
            if (
                previewUrlRef.current
            ) {
                URL.revokeObjectURL(
                    previewUrlRef.current
                );
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (
                downloadAbortRef.current
            ) {
                downloadAbortRef.current.abort();
            }
        };
    }, []);

    const totalFolderSize = useMemo(() => {
        return files.reduce(
            (total, file) =>
                total +
                (
                    Number(file.size) || 0
                ),
            0
        );
    }, [files]);

    const handleBrowseFiles = () => {
        if (uploading) {
            return;
        }

        fileInputRef.current?.click();
    };

    const resetUploadState = () => {
        setUploading(false);
        setUploadProgress(0);
        setUploadingFileName("");
        setUploadedBytes(0);
        setTotalBytes(0);
    };

    const uploadFiles = async (
        selectedFiles
    ) => {
        const filesArray =
            Array.from(
                selectedFiles || []
            );

        if (
            filesArray.length === 0 ||
            uploading
        ) {
            return;
        }

        if (!folderId) {
            setError(
                "Invalid folder. Please go back and open the folder again."
            );

            return;
        }

        try {
            setUploading(true);
            setError("");
            setSuccess("");

            const totalSize =
                filesArray.reduce(
                    (total, file) =>
                        total + file.size,
                    0
                );

            let completedSize = 0;

            setTotalBytes(totalSize);
            setUploadedBytes(0);
            setUploadProgress(0);

            for (
                let index = 0;
                index < filesArray.length;
                index += 1
            ) {
                const selectedFile =
                    filesArray[index];

                setUploadingFileName(
                    selectedFile.name
                );

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    selectedFile,
                    selectedFile.name
                );

                formData.append(
                    "folder_id",
                    Number(folderId).toString()
                );

                await api.post(
                    "/files/upload",
                    formData,
                    {
                        onUploadProgress: (
                            progressEvent
                        ) => {
                            const currentLoaded =
                                progressEvent.loaded || 0;

                            const currentTotal =
                                progressEvent.total ||
                                selectedFile.size;

                            const currentProgress =
                                currentTotal > 0
                                    ? (
                                        currentLoaded /
                                        currentTotal
                                    ) *
                                    selectedFile.size
                                    : 0;

                            const uploaded =
                                Math.min(
                                    completedSize +
                                    currentProgress,
                                    totalSize
                                );

                            const percentage =
                                totalSize > 0
                                    ? Math.round(
                                        (
                                            uploaded /
                                            totalSize
                                        ) *
                                        100
                                    )
                                    : 0;

                            setUploadedBytes(
                                uploaded
                            );

                            setUploadProgress(
                                percentage
                            );
                        },
                    }
                );

                completedSize +=
                    selectedFile.size;

                setUploadedBytes(
                    completedSize
                );

                setUploadProgress(
                    totalSize > 0
                        ? Math.round(
                            (
                                completedSize /
                                totalSize
                            ) *
                            100
                        )
                        : 100
                );
            }

            setUploadProgress(100);

            await loadFolderFiles();

            setSuccess(
                filesArray.length === 1
                    ? "File uploaded successfully."
                    : `${filesArray.length} files uploaded successfully.`
            );

            setTimeout(() => {
                resetUploadState();
            }, 800);

        } catch (err) {
            console.error(
                "Upload error:",
                err
            );

            setError(
                getErrorMessage(err)
            );

            resetUploadState();
        }
    };

    const handleFileChange = (
        event
    ) => {
        const selectedFiles =
            event.target.files;

        uploadFiles(
            selectedFiles
        );

        event.target.value = "";
    };

    const handleDragEnter = (
        event
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (!uploading) {
            setDragActive(true);
        }
    };

    const handleDragOver = (
        event
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (!uploading) {
            setDragActive(true);
        }
    };

    const handleDragLeave = (
        event
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setDragActive(false);
    };

    const handleDrop = (
        event
    ) => {
        event.preventDefault();
        event.stopPropagation();

        setDragActive(false);

        if (uploading) {
            return;
        }

        uploadFiles(
            event.dataTransfer.files
        );
    };

    const closePreview = () => {
        if (
            previewUrlRef.current
        ) {
            URL.revokeObjectURL(
                previewUrlRef.current
            );

            previewUrlRef.current =
                null;
        }

        setPreviewFile(null);
        setPreviewUrl("");
        setPreviewLoading(false);
        setPreviewError("");
        setImageZoom(1);
    };

    const openFile = async (
        file
    ) => {
        try {
            setActiveMenuId(null);

            if (
                previewUrlRef.current
            ) {
                URL.revokeObjectURL(
                    previewUrlRef.current
                );

                previewUrlRef.current =
                    null;
            }

            setPreviewFile(file);
            setPreviewUrl("");
            setPreviewLoading(true);
            setPreviewError("");
            setImageZoom(1);

            const response =
                await api.get(
                    `/files/${file.id}/preview`,
                    {
                        responseType: "blob",
                    }
                );

            const mimeType =
                file.mime_type ||
                response.data.type ||
                "application/octet-stream";

            const blob =
                new Blob(
                    [response.data],
                    {
                        type: mimeType,
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            previewUrlRef.current =
                url;

            setPreviewUrl(url);

        } catch (err) {
            console.error(
                "Preview error:",
                err
            );

            setPreviewError(
                getErrorMessage(err)
            );
            setPreviewFile(null);
            setPreviewUrl("");

        } finally {
            setPreviewLoading(false);
        }
    };

    const openNextPreview = () => {
        if (
            previewItems.length === 0 ||
            currentPreviewIndex === -1
        ) {
            return;
        }

        const nextIndex =
            (
                currentPreviewIndex +
                1
            ) %
            previewItems.length;

        openFile(
            previewItems[
                nextIndex
            ]
        );
    };

    const openPreviousPreview = () => {
        if (
            previewItems.length === 0 ||
            currentPreviewIndex === -1
        ) {
            return;
        }

        const previousIndex =
            (
                currentPreviewIndex -
                1 +
                previewItems.length
            ) %
            previewItems.length;

        openFile(
            previewItems[
                previousIndex
            ]
        );
    };

    const handlePreviewBackgroundClick = (
        event
    ) => {
        if (
            event.target === event.currentTarget
        ) {
            closePreview();
        }
    };

    const openDownloadConfirm = (
        file
    ) => {
        setActiveMenuId(null);
        setDownloadConfirmFile(file);
    };

    const closeDownloadConfirm = () => {
        if (downloading) {
            return;
        }

        setDownloadConfirmFile(null);
    };

    const startDownload = async () => {
        if (!downloadConfirmFile) {
            return;
        }

        const file =
            downloadConfirmFile;

        try {
            setDownloadConfirmFile(null);

            setDownloadingFile(file);

            setDownloading(true);

            setDownloadProgress(0);

            setDownloadedBytes(0);

            const expectedSize =
                Number(file.size) || 0;

            setDownloadTotalBytes(
                expectedSize
            );

            const controller =
                new AbortController();

            downloadAbortRef.current =
                controller;

            const response =
                await api.get(
                    `/files/${file.id}/download`,
                    {
                        responseType: "blob",

                        signal:
                            controller.signal,

                        onDownloadProgress: (
                            progressEvent
                        ) => {
                            const loaded =
                                progressEvent.loaded || 0;

                            const total =
                                progressEvent.total ||
                                expectedSize ||
                                0;

                            setDownloadedBytes(
                                loaded
                            );

                            if (
                                total > 0
                            ) {
                                setDownloadTotalBytes(
                                    total
                                );

                                setDownloadProgress(
                                    Math.min(
                                        100,
                                        Math.round(
                                            (
                                                loaded /
                                                total
                                            ) *
                                            100
                                        )
                                    )
                                );
                            }
                        },
                    }
                );

            setDownloadProgress(100);

            const blobUrl =
                URL.createObjectURL(
                    response.data
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href = blobUrl;

            link.download =
                file.original_name;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            setTimeout(() => {
                URL.revokeObjectURL(
                    blobUrl
                );
            }, 1000);

            setSuccess(
                "File downloaded successfully."
            );

        } catch (err) {
            if (
                err?.code ===
                "ERR_CANCELED" ||
                err?.name ===
                "CanceledError"
            ) {
                setSuccess(
                    "Download cancelled."
                );

            } else {
                console.error(
                    "Download error:",
                    err
                );

                setError(
                    getErrorMessage(err)
                );
            }

        } finally {
            downloadAbortRef.current =
                null;

            setDownloading(false);

            setDownloadingFile(null);

            setTimeout(() => {
                setDownloadProgress(0);
                setDownloadedBytes(0);
                setDownloadTotalBytes(0);
            }, 300);
        }
    };

    const cancelDownload = () => {
        if (
            downloadAbortRef.current
        ) {
            downloadAbortRef.current.abort();
        }
    };

    const openRenameModal = (
        file
    ) => {
        setActiveMenuId(null);

        setRenameFile(file);

        setRenameValue(
            file.original_name
        );
    };

    const closeRenameModal = () => {
        if (actionLoading) {
            return;
        }

        setRenameFile(null);

        setRenameValue("");
    };

    const renameFileHandler = async (
        event
    ) => {
        event.preventDefault();

        if (
            !renameFile ||
            !renameValue.trim()
        ) {
            setError(
                "File name cannot be empty."
            );

            return;
        }

        try {
            setActionLoading(true);

            await api.put(
                `/files/${renameFile.id}/rename`,
                {
                    original_name:
                        renameValue.trim(),
                }
            );

            await loadFolderFiles();

            setSuccess(
                "File renamed successfully."
            );

            setRenameFile(null);

            setRenameValue("");

        } catch (err) {
            console.error(
                "Rename error:",
                err
            );

            setError(
                getErrorMessage(err)
            );

        } finally {
            setActionLoading(false);
        }
    };

    const openDeleteConfirm = (
        file
    ) => {
        setActiveMenuId(null);

        setDeleteFile(file);
    };

    const closeDeleteConfirm = () => {
        if (deleteLoading) {
            return;
        }

        setDeleteFile(null);
    };

    const confirmDeleteFile = async () => {
        if (!deleteFile) {
            return;
        }

        try {
            setDeleteLoading(true);

            await api.delete(
                `/files/${deleteFile.id}`
            );

            setFiles(
                (currentFiles) =>
                    currentFiles.filter(
                        (
                            currentFile
                        ) =>
                            currentFile.id !==
                            deleteFile.id
                    )
            );

            // Close preview if the deleted file was open
            if (previewFile?.id === deleteFile.id) {
                closePreview();
            }

            setSuccess(
                "File moved to trash."
            );

            setDeleteFile(null);

        } catch (err) {
            console.error(
                "Delete error:",
                err
            );

            setError(
                getErrorMessage(err)
            );

        } finally {
            setDeleteLoading(false);
        }
    };

    const shareFile = async (
        file
    ) => {
        try {
            setActiveMenuId(null);

            setActionLoading(true);

            let response;

            try {
                response =
                    await api.post(
                        `/shares/file/${file.id}`
                    );

            } catch (
                firstError
            ) {
                if (
                    firstError?.response
                        ?.status !== 404
                ) {
                    throw firstError;
                }

                try {
                    response =
                        await api.post(
                            `/shares/files/${file.id}`
                        );

                } catch (
                    secondError
                ) {
                    if (
                        secondError
                            ?.response
                            ?.status !== 404
                    ) {
                        throw secondError;
                    }

                    try {
                        response =
                            await api.post(
                                `/shares/${file.id}`
                            );

                    } catch (
                        thirdError
                    ) {
                        if (
                            thirdError
                                ?.response
                                ?.status !== 404
                        ) {
                            throw thirdError;
                        }

                        response =
                            await api.post(
                                "/shares/",
                                {
                                    file_id:
                                        file.id,
                                }
                            );
                    }
                }
            }

            const shareData =
                response.data || {};

            const shareToken =
                shareData.share_token ||
                shareData.token ||
                shareData.shareToken;

            if (!shareToken) {
                throw new Error(
                    "Share token was not returned by the server."
                );
            }

            const shareUrl =
                getPublicShareUrl(
                    shareToken
                );

            await navigator.clipboard.writeText(
                shareUrl
            );

            setSuccess(
                "Share link copied to clipboard."
            );

        } catch (err) {
            console.error(
                "Share error:",
                err
            );

            setError(
                getErrorMessage(err)
            );

        } finally {
            setActionLoading(false);
        }
    };

    const renderPreviewContent = () => {
        if (
            previewLoading
        ) {
            return (
                <div className="flex min-h-[70vh] items-center justify-center">

                    <div className="flex flex-col items-center">

                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />

                        <p className="mt-5 text-sm font-medium text-white/70">
                            Opening file...
                        </p>

                    </div>

                </div>
            );
        }

        if (previewError) {
            return (
                <div className="flex min-h-[70vh] flex-col items-center justify-center">
                    <div className="rounded-2xl bg-red-500/10 p-8 text-center text-red-300">
                        <p className="text-lg font-semibold">Unable to preview</p>
                        <p className="mt-2 text-sm">{previewError}</p>
                    </div>
                </div>
            );
        }

        if (
            !previewFile ||
            !previewUrl
        ) {
            return null;
        }

        const type =
            previewFile.mime_type ||
            previewFile.type ||
            "";

        if (
            type.startsWith("image/")
        ) {
            return (
                <div className="flex h-full min-h-[70vh] w-full items-center justify-center p-2 sm:p-6">

                    <img
                        src={previewUrl}
                        alt={
                            previewFile.original_name
                        }
                        draggable="false"
                        style={{
                            transform: `scale(${imageZoom})`,
                        }}
                        className="max-h-[82vh] max-w-full select-none object-contain transition-transform duration-200"
                    />

                </div>
            );
        }

        if (
            type.startsWith("video/")
        ) {
            return (
                <div className="flex min-h-[70vh] w-full items-center justify-center">

                    <video
                        src={previewUrl}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[82vh] max-w-full rounded-2xl bg-black shadow-2xl"
                    />

                </div>
            );
        }

        if (
            type.startsWith("audio/")
        ) {
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center">

                    <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-pink-500/20">

                        <FaMusic className="text-4xl text-pink-400" />

                    </div>

                    <h3 className="mb-6 max-w-md truncate text-center text-lg font-semibold text-white">
                        {previewFile.original_name}
                    </h3>

                    <audio
                        src={previewUrl}
                        controls
                        autoPlay
                        className="w-full max-w-xl"
                    />

                </div>
            );
        }

        if (
            type ===
            "application/pdf"
        ) {
            return (
                <iframe
                    src={previewUrl}
                    title={
                        previewFile.original_name
                    }
                    className="h-[82vh] w-full rounded-2xl border-0 bg-white"
                />
            );
        }

        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">

                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">

                    <FaFileAlt className="text-5xl text-blue-400" />

                </div>

                <h3 className="mt-7 text-xl font-bold text-white">
                    Preview is not available
                </h3>

                <p className="mt-3 text-sm text-white/60">
                    You can download this file to view it.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        openDownloadConfirm(
                            previewFile
                        )
                    }
                    className="mt-7 flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                    <FaDownload />

                    Download File
                </button>

            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f5f9]">

                <div className="flex flex-col items-center">

                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Opening folder...
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f5f9]">

            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={
                    handleFileChange
                }
            />

            {success && (
                <div className="fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-xl">

                    <FaCheck />

                    <span>
                        {success}
                    </span>

                </div>
            )}

            {error && (
                <div className="fixed right-5 top-5 z-[100] flex max-w-md items-center gap-3 rounded-2xl bg-red-500 px-5 py-3 text-sm font-medium text-white shadow-xl">

                    <FaTimes className="flex-shrink-0" />

                    <span>
                        {error}
                    </span>

                </div>
            )}

            <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl shadow-sm sm:px-8">

                <div className="flex items-center gap-4">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                    >
                        <FaArrowLeft />
                    </button>

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">

                            <FaCloud className="text-white" />

                        </div>

                        <div>

                            <h1 className="font-bold text-slate-800">
                                CloudVault
                            </h1>

                            <p className="text-[11px] text-slate-500">
                                Cloud Storage
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={
                        handleBrowseFiles
                    }
                    disabled={uploading}
                    className="hidden items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
                >
                    <FaCloudUploadAlt />

                    Upload Files

                </button>

            </header>

            <main className="mx-auto w-full max-w-7xl p-4 sm:p-8">

                <div className="mb-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">

                            <FaFolder className="text-2xl text-yellow-400" />

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                My Drive
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
                                {folderName}
                            </h2>

                        </div>

                    </div>

                    <p className="mt-4 text-sm text-slate-500">

                        {files.length === 0
                            ? "This folder is currently empty."
                            : `${files.length} ${files.length === 1 ? "file" : "files"} • ${formatBytes(
                                totalFolderSize
                            )}`}

                    </p>

                </div>

                {files.length === 0 ||
                    uploading ? (

                    <div
                        onDragEnter={
                            handleDragEnter
                        }
                        onDragOver={
                            handleDragOver
                        }
                        onDragLeave={
                            handleDragLeave
                        }
                        onDrop={
                            handleDrop
                        }
                        className={`relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-[#1a2332] to-[#2a3a52] p-6 shadow-xl transition sm:p-10 ${dragActive
                                ? "border-blue-400 ring-4 ring-blue-200"
                                : "border-slate-700"
                            }`}
                    >

                        <div className="absolute inset-0 opacity-30">

                            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />

                            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl" />

                        </div>

                        <div className="relative mx-auto flex min-h-[420px] max-w-4xl flex-col justify-center">

                            {!uploading ? (

                                <>

                                    <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:gap-16">

                                        <div className="relative flex h-36 w-36 items-center justify-center">

                                            <div className="absolute h-28 w-32 rounded-t-2xl rounded-b-xl bg-gradient-to-b from-blue-400 to-blue-700 shadow-2xl" />

                                            <div className="absolute left-4 top-3 h-10 w-16 rounded-t-xl bg-blue-400" />

                                            <div className="relative z-10 mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 shadow-xl">

                                                <FaCloudUploadAlt className="text-3xl text-white" />

                                            </div>

                                        </div>

                                        <div className="text-center md:text-left">

                                            <h3 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                                                Upload files
                                            </h3>

                                            <p className="mt-3 text-xl text-slate-300 sm:text-2xl">
                                                Drag & drop or browse
                                            </p>

                                        </div>

                                    </div>

                                    <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">

                                        <button
                                            type="button"
                                            onClick={
                                                handleBrowseFiles
                                            }
                                            className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-700 px-10 py-5 text-xl font-bold text-white shadow-xl transition hover:scale-105 active:scale-95"
                                        >
                                            <FaCloudUploadAlt />

                                            Upload

                                        </button>

                                    </div>

                                </>

                            ) : (

                                <div className="mx-auto w-full max-w-3xl">

                                    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">

                                        <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-3xl bg-blue-600">

                                            <FaCloudUploadAlt className="text-4xl text-white" />

                                        </div>

                                        <div className="w-full text-center sm:text-left">

                                            <p className="mb-2 text-sm font-medium text-blue-300">
                                                Uploading to {folderName}
                                            </p>

                                            <h3 className="truncate text-2xl font-bold text-white">
                                                {uploadingFileName}
                                            </h3>

                                            <p className="mt-2 text-sm text-slate-400">

                                                {formatBytes(
                                                    uploadedBytes
                                                )}

                                                {" "}of{" "}

                                                {formatBytes(
                                                    totalBytes
                                                )}

                                            </p>

                                        </div>

                                    </div>

                                    <div className="mt-10 flex items-center gap-5">

                                        <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-700">

                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                                                style={{
                                                    width: `${uploadProgress}%`,
                                                }}
                                            />

                                        </div>

                                        <span className="min-w-[65px] text-2xl font-semibold text-white">
                                            {uploadProgress}%
                                        </span>

                                    </div>

                                </div>

                            )}

                        </div>

                    </div>

                ) : (

                    <>

                        <div
                            onDragEnter={
                                handleDragEnter
                            }
                            onDragOver={
                                handleDragOver
                            }
                            onDragLeave={
                                handleDragLeave
                            }
                            onDrop={
                                handleDrop
                            }
                            className={`mb-6 rounded-3xl border-2 border-dashed p-6 text-center transition ${dragActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-slate-300 bg-white"
                                }`}
                        >

                            <FaCloudUploadAlt className="mx-auto text-3xl text-blue-500" />

                            <h3 className="mt-3 font-semibold text-slate-700">
                                Add more files
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Drag and drop files here or click below.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleBrowseFiles
                                }
                                disabled={uploading}
                                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Browse Files
                            </button>

                        </div>

                        <div className="overflow-visible rounded-3xl bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

                                <h3 className="font-bold text-slate-800">
                                    Files in {folderName}
                                </h3>

                            </div>

                            <div className="divide-y divide-slate-100">

                                {files.map(
                                    (file) => (

                                        <div
                                            key={
                                                file.id
                                            }
                                            className="relative flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                                        >

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openFile(
                                                        file
                                                    )
                                                }
                                                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                                            >

                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">

                                                    {getFileIcon(
                                                        file
                                                    )}

                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <p className="truncate font-semibold text-slate-700">

                                                        {
                                                            file.original_name
                                                        }

                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">

                                                        {formatBytes(
                                                            file.size
                                                        )}

                                                    </p>

                                                </div>

                                            </button>

                                            <div
                                                ref={
                                                    activeMenuId ===
                                                        file.id
                                                        ? menuRef
                                                        : null
                                                }
                                                className="relative"
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveMenuId(
                                                            (
                                                                currentId
                                                            ) =>
                                                                currentId ===
                                                                    file.id
                                                                    ? null
                                                                    : file.id
                                                        )
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                >
                                                    <FaEllipsisV />
                                                </button>

                                                {activeMenuId ===
                                                    file.id && (

                                                    <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openFile(
                                                                    file
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >

                                                            <FaExternalLinkAlt className="text-blue-500" />

                                                            Open

                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                shareFile(
                                                                    file
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >

                                                            <FaShareAlt className="text-purple-500" />

                                                            Share

                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openRenameModal(
                                                                    file
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >

                                                            <FaPencilAlt className="text-amber-500" />

                                                            Rename

                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDownloadConfirm(
                                                                    file
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >

                                                            <FaDownload className="text-emerald-500" />

                                                            Download

                                                        </button>

                                                        <div className="my-1 border-t border-slate-100" />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDeleteConfirm(
                                                                    file
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                        >

                                                            <FaTrash />

                                                            Delete

                                                        </button>

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </>

                )}

            </main>

            {/* iOS-style Preview Modal */}
            {previewFile && (

                <div
                    onMouseDown={
                        handlePreviewBackgroundClick
                    }
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-4"
                >

                    <div
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                        className="relative flex h-full w-full flex-col overflow-hidden bg-[#09090b] shadow-2xl sm:h-[94vh] sm:max-w-6xl sm:rounded-[32px]"
                    >

                        {/* Top Bar - iOS Style */}
                        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">

                            <div className="min-w-0 pr-4">

                                <p className="truncate text-sm font-medium text-white">
                                    {
                                        previewFile.original_name
                                    }
                                </p>

                                <p className="mt-0.5 text-xs text-white/50">
                                    {formatBytes(
                                        previewFile.size
                                    )}
                                </p>

                            </div>

                            <div className="flex flex-shrink-0 items-center gap-2">

                                {/* Zoom Controls for Images */}
                                {isImage(previewFile) && previewUrl && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setImageZoom(
                                                    (prev) =>
                                                        Math.max(
                                                            0.5,
                                                            prev - 0.25
                                                        )
                                                )
                                            }
                                            className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:flex"
                                        >
                                            <FaMinus className="text-sm" />
                                        </button>

                                        <button
                                            onClick={() =>
                                                setImageZoom(1)
                                            }
                                            className="hidden h-9 rounded-full bg-white/10 px-3 text-xs text-white backdrop-blur transition hover:bg-white/20 sm:block"
                                        >
                                            {Math.round(imageZoom * 100)}%
                                        </button>

                                        <button
                                            onClick={() =>
                                                setImageZoom(
                                                    (prev) =>
                                                        Math.min(
                                                            3,
                                                            prev + 0.25
                                                        )
                                                )
                                            }
                                            className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:flex"
                                        >
                                            <FaPlus className="text-sm" />
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        openDownloadConfirm(
                                            previewFile
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:h-11 sm:w-11"
                                >
                                    <FaDownload />
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        closePreview
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-black shadow-xl transition hover:scale-105 active:scale-95 sm:h-11 sm:w-11"
                                >
                                    <FaTimes />
                                </button>

                            </div>

                        </div>

                        {/* Navigation Arrows */}
                        {previewItems.length > 1 && (
                            <>
                                <button
                                    onClick={openPreviousPreview}
                                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/70 sm:left-6 sm:h-12 sm:w-12 sm:text-2xl"
                                >
                                    <FaChevronLeft />
                                </button>

                                <button
                                    onClick={openNextPreview}
                                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/70 sm:right-6 sm:h-12 sm:w-12 sm:text-2xl"
                                >
                                    <FaChevronRight />
                                </button>
                            </>
                        )}

                        {/* Preview Content */}
                        <div className="min-h-0 flex-1 overflow-auto pt-[65px] sm:pt-[75px]">

                            {renderPreviewContent()}

                        </div>

                        {/* Bottom Bar - iOS Style */}
                        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-white/40 backdrop-blur-xl sm:px-6">

                            <span>

                                {currentPreviewIndex >= 0
                                    ? `${currentPreviewIndex + 1} of ${previewItems.length}`
                                    : ""}

                            </span>

                            <span className="hidden sm:block">

                                ← → Navigate &nbsp;•&nbsp; ESC Close

                            </span>

                        </div>

                    </div>

                </div>

            )}

            {/* Rename Modal - iOS Style */}
            {renameFile && (

                <div className="fixed inset-0 z-[210] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">

                    <form
                        onSubmit={
                            renameFileHandler
                        }
                        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
                    >

                        <div className="flex items-center justify-between">

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
                                onClick={
                                    closeRenameModal
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <input
                            type="text"
                            value={
                                renameValue
                            }
                            onChange={(
                                event
                            ) =>
                                setRenameValue(
                                    event.target.value
                                )
                            }
                            autoFocus
                            className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={
                                    closeRenameModal
                                }
                                disabled={
                                    actionLoading
                                }
                                className="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    actionLoading
                                }
                                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >

                                {actionLoading
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </form>

                </div>

            )}

            {/* Delete Confirmation - iOS Style Action Sheet */}
            {deleteFile && (

                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] bg-[#f8f8fa] shadow-2xl">

                        <div className="flex flex-col items-center px-6 pb-5 pt-7">

                            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-red-100">

                                <FaTrash className="text-2xl text-red-500" />

                            </div>

                            <h3 className="mt-4 text-xl font-bold text-slate-700">
                                Move to Trash?
                            </h3>

                            <p className="mt-3 max-w-[270px] text-center text-[15px] leading-6 text-slate-500">
                                Are you sure you want to move
                            </p>

                            <p className="max-w-[300px] truncate text-center font-semibold text-slate-700">
                                {deleteFile.original_name}
                            </p>

                            <p className="text-center text-[15px] text-slate-500">
                                to Trash?
                            </p>

                        </div>

                        <div className="border-t border-slate-300">

                            <button
                                type="button"
                                onClick={
                                    confirmDeleteFile
                                }
                                disabled={
                                    deleteLoading
                                }
                                className="flex w-full items-center justify-center border-b border-slate-300 px-6 py-4 text-[17px] font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                            >

                                {deleteLoading
                                    ? "Moving..."
                                    : "Move to Trash"}

                            </button>

                            <button
                                type="button"
                                onClick={
                                    closeDeleteConfirm
                                }
                                disabled={
                                    deleteLoading
                                }
                                className="flex w-full items-center justify-center px-6 py-4 text-[17px] font-semibold text-[#3560a8] transition hover:bg-slate-100 disabled:opacity-60"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* Download Confirmation - iOS Style Action Sheet */}
            {downloadConfirmFile && (

                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] bg-[#f8f8fa] shadow-2xl">

                        <div className="flex flex-col items-center px-6 pb-5 pt-7">

                            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-blue-100">

                                <FaDownload className="text-2xl text-blue-600" />

                            </div>

                            <h3 className="mt-4 text-xl font-bold text-slate-700">
                                Download File?
                            </h3>

                            <p className="mt-3 text-center text-[15px] leading-6 text-slate-500">
                                Do you want to download
                            </p>

                            <p className="max-w-[300px] truncate text-center font-semibold text-slate-700">
                                {
                                    downloadConfirmFile.original_name
                                }
                            </p>

                            <p className="mt-1 text-center text-sm text-slate-400">
                                {formatBytes(
                                    downloadConfirmFile.size
                                )}
                            </p>

                        </div>

                        <div className="border-t border-slate-300">

                            <button
                                type="button"
                                onClick={
                                    startDownload
                                }
                                className="flex w-full items-center justify-center gap-2 border-b border-slate-300 px-6 py-4 text-[17px] font-semibold text-blue-600 transition hover:bg-blue-50"
                            >

                                <FaDownload />

                                Download

                            </button>

                            <button
                                type="button"
                                onClick={
                                    closeDownloadConfirm
                                }
                                className="flex w-full items-center justify-center px-6 py-4 text-[17px] font-semibold text-[#3560a8] transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* Download Progress Modal - iOS Style */}
            {downloading && downloadingFile && (

                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-[420px] overflow-hidden rounded-[28px] bg-[#f8f8fa] shadow-2xl">

                        <div className="px-7 py-8">

                            <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-blue-100">

                                <FaDownload className="text-2xl text-blue-600" />

                            </div>

                            <h3 className="mt-5 text-center text-xl font-bold text-slate-800">
                                Downloading
                            </h3>

                            <p className="mt-2 truncate text-center text-sm font-medium text-slate-600">
                                {
                                    downloadingFile.original_name
                                }
                            </p>

                            <div className="mt-7">

                                <div className="mb-3 flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-500">
                                        Downloading file
                                    </span>

                                    <span className="text-sm font-bold text-blue-600">
                                        {downloadProgress}%
                                    </span>

                                </div>

                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">

                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all duration-200"
                                        style={{
                                            width: `${downloadProgress}%`,
                                        }}
                                    />

                                </div>

                                <div className="mt-3 flex justify-between text-xs text-slate-400">

                                    <span>

                                        {formatBytes(
                                            downloadedBytes
                                        )}

                                    </span>

                                    <span>

                                        {downloadTotalBytes > 0
                                            ? formatBytes(
                                                downloadTotalBytes
                                            )
                                            : formatBytes(
                                                downloadingFile.size
                                            )}

                                    </span>

                                </div>

                            </div>

                            <p className="mt-6 text-center text-sm text-slate-400">
                                Please keep this page open while your file downloads.
                            </p>

                        </div>

                        <div className="border-t border-slate-300">

                            <button
                                type="button"
                                onClick={
                                    cancelDownload
                                }
                                className="flex w-full items-center justify-center px-6 py-4 text-[17px] font-semibold text-red-500 transition hover:bg-red-50"
                            >
                                Cancel Download
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Folder;
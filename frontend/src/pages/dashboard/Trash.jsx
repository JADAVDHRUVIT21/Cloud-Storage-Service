import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import api, {
    getTrashFiles,
    restoreTrashFile,
    permanentlyDeleteTrashFile,
    getTrashFolders,
    getTrashFolderFiles,
    restoreTrashFolder,
    permanentlyDeleteTrashFolder,
} from "../../services/api";


function Trash() {

    const navigate = useNavigate();

    const [files, setFiles] =
        useState([]);

    const [folders, setFolders] =
        useState([]);

    const [folderFiles, setFolderFiles] =
        useState([]);

    const [openedFolder, setOpenedFolder] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [folderLoading, setFolderLoading] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(null);

    const [error, setError] =
        useState("");

    const [restoreItem, setRestoreItem] =
        useState(null);

    const [deleteItem, setDeleteItem] =
        useState(null);

    const [previewFile, setPreviewFile] =
        useState(null);

    const [previewUrl, setPreviewUrl] =
        useState("");

    const [previewLoading, setPreviewLoading] =
        useState(false);

    const [previewError, setPreviewError] =
        useState("");

    const [imageZoom, setImageZoom] =
        useState(1);

    const [
        showEmptyConfirm,
        setShowEmptyConfirm,
    ] = useState(false);

    const [
        showRestoreAllConfirm,
        setShowRestoreAllConfirm,
    ] = useState(false);


    useEffect(() => {

        loadTrash();

    }, []);


    useEffect(() => {

        return () => {

            if (
                previewUrl
            ) {

                URL.revokeObjectURL(
                    previewUrl
                );

            }

        };

    }, [
        previewUrl
    ]);


    useEffect(() => {

        const handleKeyboard =
            (event) => {

                if (
                    !previewFile
                ) {

                    return;

                }

                if (
                    event.key ===
                    "Escape"
                ) {

                    closePreview();

                }

                if (
                    event.key ===
                    "ArrowRight"
                ) {

                    openNextPreview();

                }

                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    openPreviousPreview();

                }

            };

        window.addEventListener(
            "keydown",
            handleKeyboard
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyboard
            );

        };

    }, [
        previewFile,
        files,
        folderFiles,
    ]);


    const loadTrash =
        async () => {

            try {

                setLoading(
                    true
                );

                setError(
                    ""
                );

                const [
                    filesData,
                    foldersData,
                ] = await Promise.all([
                    getTrashFiles(),
                    getTrashFolders(),
                ]);

                const deletedFolders =
                    foldersData || [];

                const deletedFolderIds =
                    new Set(
                        deletedFolders.map(
                            (
                                folder
                            ) =>
                                folder.id
                        )
                    );

                const visibleFiles =
                    (
                        filesData || []
                    ).filter(
                        (
                            file
                        ) => {

                            if (
                                !file.folder_id
                            ) {

                                return true;

                            }

                            return !deletedFolderIds.has(
                                file.folder_id
                            );

                        }
                    );

                setFiles(
                    visibleFiles
                );

                setFolders(
                    deletedFolders
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                setError(
                    error.response?.data?.detail ||
                    "Failed to load trash"
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    const openFolder =
        async (
            folder
        ) => {

            try {

                setFolderLoading(
                    true
                );

                setError(
                    ""
                );

                const data =
                    await getTrashFolderFiles(
                        folder.id
                    );

                setOpenedFolder(
                    folder
                );

                setFolderFiles(
                    data || []
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                alert(
                    error.response?.data?.detail ||
                    "Failed to open folder"
                );

            } finally {

                setFolderLoading(
                    false
                );

            }

        };


    const closeFolder =
        () => {

            setOpenedFolder(
                null
            );

            setFolderFiles(
                []
            );

        };


    const formatFileSize =
        (
            bytes
        ) => {

            if (
                !bytes ||
                bytes === 0
            ) {

                return "0 Bytes";

            }

            const sizes = [
                "Bytes",
                "KB",
                "MB",
                "GB",
                "TB",
            ];

            const index =
                Math.floor(
                    Math.log(
                        bytes
                    ) /
                    Math.log(
                        1024
                    )
                );

            return `${parseFloat(
                (
                    bytes /
                    Math.pow(
                        1024,
                        index
                    )
                ).toFixed(
                    2
                )
            )} ${sizes[index]}`;

        };


    const getFileType =
        (
            file
        ) => {

            if (
                file.mime_type
            ) {

                return file.mime_type;

            }

            const fileName =
                file.original_name ||
                "";

            const extension =
                fileName
                    .split(
                        "."
                    )
                    .pop();

            return extension
                ? extension.toUpperCase()
                : "Unknown";

        };


    const isImage =
        (
            file
        ) => {

            return Boolean(
                file?.mime_type &&
                file.mime_type.startsWith(
                    "image/"
                )
            );

        };


    const isVideo =
        (
            file
        ) => {

            return Boolean(
                file?.mime_type &&
                file.mime_type.startsWith(
                    "video/"
                )
            );

        };


    const getItemName =
        (
            item
        ) => {

            if (
                item.type ===
                "folder"
            ) {

                return item.name;

            }

            return item.original_name;

        };


    const previewItems =
        useMemo(
            () => {

                if (
                    openedFolder
                ) {

                    return folderFiles.filter(
                        (
                            file
                        ) =>
                            isImage(
                                file
                            ) ||
                            isVideo(
                                file
                            )
                    );

                }

                return files.filter(
                    (
                        file
                    ) =>
                        isImage(
                            file
                        ) ||
                        isVideo(
                            file
                        )
                );

            },
            [
                openedFolder,
                files,
                folderFiles,
            ]
        );


    const currentPreviewIndex =
        previewFile
            ? previewItems.findIndex(
                (
                    file
                ) =>
                    file.id ===
                    previewFile.id
            )
            : -1;


    const closePreview =
        () => {

            if (
                previewUrl
            ) {

                URL.revokeObjectURL(
                    previewUrl
                );

            }

            setPreviewUrl(
                ""
            );

            setPreviewFile(
                null
            );

            setPreviewLoading(
                false
            );

            setPreviewError(
                ""
            );

            setImageZoom(
                1
            );

        };


    const openPreview =
        async (
            file
        ) => {

            if (
                !isImage(
                    file
                ) &&
                !isVideo(
                    file
                )
            ) {

                return;

            }

            try {

                setPreviewLoading(
                    true
                );

                setPreviewError(
                    ""
                );

                setImageZoom(
                    1
                );

                if (
                    previewUrl
                ) {

                    URL.revokeObjectURL(
                        previewUrl
                    );

                }

                setPreviewUrl(
                    ""
                );

                setPreviewFile(
                    file
                );

                const response =
                    await api.get(
                        `/files/${file.id}/preview`,
                        {
                            responseType:
                                "blob",
                        }
                    );

                const objectUrl =
                    URL.createObjectURL(
                        response.data
                    );

                setPreviewUrl(
                    objectUrl
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                setPreviewError(
                    error.response?.data?.detail ||
                    "Failed to open preview"
                );

            } finally {

                setPreviewLoading(
                    false
                );

            }

        };


    const openNextPreview =
        () => {

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

            openPreview(
                previewItems[
                    nextIndex
                ]
            );

        };


    const openPreviousPreview =
        () => {

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

            openPreview(
                previewItems[
                    previousIndex
                ]
            );

        };


    const handleRestore =
        async () => {

            if (
                !restoreItem
            ) {

                return;

            }

            try {

                setActionLoading(
                    `restore-${restoreItem.type}-${restoreItem.id}`
                );

                if (
                    restoreItem.type ===
                    "folder"
                ) {

                    await restoreTrashFolder(
                        restoreItem.id
                    );

                    setFolders(
                        (
                            previousFolders
                        ) =>
                            previousFolders.filter(
                                (
                                    folder
                                ) =>
                                    folder.id !==
                                    restoreItem.id
                            )
                    );

                    if (
                        openedFolder &&
                        openedFolder.id ===
                        restoreItem.id
                    ) {

                        closeFolder();

                    }

                } else {

                    await restoreTrashFile(
                        restoreItem.id
                    );

                    setFiles(
                        (
                            previousFiles
                        ) =>
                            previousFiles.filter(
                                (
                                    file
                                ) =>
                                    file.id !==
                                    restoreItem.id
                            )
                    );

                    setFolderFiles(
                        (
                            previousFiles
                        ) =>
                            previousFiles.filter(
                                (
                                    file
                                ) =>
                                    file.id !==
                                    restoreItem.id
                            )
                    );

                }

                setRestoreItem(
                    null
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                alert(
                    error.response?.data?.detail ||
                    "Failed to restore item"
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    const handlePermanentDelete =
        async () => {

            if (
                !deleteItem
            ) {

                return;

            }

            try {

                setActionLoading(
                    `delete-${deleteItem.type}-${deleteItem.id}`
                );

                if (
                    deleteItem.type ===
                    "folder"
                ) {

                    await permanentlyDeleteTrashFolder(
                        deleteItem.id
                    );

                    setFolders(
                        (
                            previousFolders
                        ) =>
                            previousFolders.filter(
                                (
                                    folder
                                ) =>
                                    folder.id !==
                                    deleteItem.id
                            )
                    );

                    if (
                        openedFolder &&
                        openedFolder.id ===
                        deleteItem.id
                    ) {

                        closeFolder();

                    }

                } else {

                    await permanentlyDeleteTrashFile(
                        deleteItem.id
                    );

                    setFiles(
                        (
                            previousFiles
                        ) =>
                            previousFiles.filter(
                                (
                                    file
                                ) =>
                                    file.id !==
                                    deleteItem.id
                            )
                    );

                    setFolderFiles(
                        (
                            previousFiles
                        ) =>
                            previousFiles.filter(
                                (
                                    file
                                ) =>
                                    file.id !==
                                    deleteItem.id
                            )
                    );

                    if (
                        previewFile &&
                        previewFile.id ===
                        deleteItem.id
                    ) {

                        closePreview();

                    }

                }

                setDeleteItem(
                    null
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                alert(
                    error.response?.data?.detail ||
                    "Failed to permanently delete item"
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    const handleRestoreAll =
        async () => {

            try {

                setActionLoading(
                    "restore-all"
                );

                await Promise.all(
                    folders.map(
                        (
                            folder
                        ) =>
                            restoreTrashFolder(
                                folder.id
                            )
                    )
                );

                await Promise.all(
                    files.map(
                        (
                            file
                        ) =>
                            restoreTrashFile(
                                file.id
                            )
                    )
                );

                setFolders(
                    []
                );

                setFiles(
                    []
                );

                closeFolder();

                setShowRestoreAllConfirm(
                    false
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                alert(
                    "Failed to restore all items"
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    const handleEmptyTrash =
        async () => {

            try {

                setActionLoading(
                    "empty-trash"
                );

                await Promise.all(
                    folders.map(
                        (
                            folder
                        ) =>
                            permanentlyDeleteTrashFolder(
                                folder.id
                            )
                    )
                );

                await Promise.all(
                    files.map(
                        (
                            file
                        ) =>
                            permanentlyDeleteTrashFile(
                                file.id
                            )
                    )
                );

                setFolders(
                    []
                );

                setFiles(
                    []
                );

                closeFolder();

                closePreview();

                setShowEmptyConfirm(
                    false
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );

                alert(
                    error.response?.data?.detail ||
                    "Failed to empty trash"
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    const allItems = [

        ...folders.map(
            (
                folder
            ) => ({
                ...folder,
                type: "folder",
            })
        ),

        ...files.map(
            (
                file
            ) => ({
                ...file,
                type: "file",
            })
        ),

    ];


    if (
        loading
    ) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">

                <div className="flex flex-col items-center gap-4">

                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />

                    <p className="text-sm font-medium text-slate-500">
                        Loading Trash...
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div className="min-h-screen bg-[#f5f5f7] p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl">


                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">


                    <div className="flex min-w-0 items-center gap-4">


                        <button
                            onClick={() => {

                                if (
                                    openedFolder
                                ) {

                                    closeFolder();

                                } else {

                                    navigate(
                                        -1
                                    );

                                }

                            }}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-slate-700 shadow-sm ring-1 ring-black/5 transition hover:scale-105 hover:bg-slate-50 active:scale-95"
                        >
                            ←
                        </button>


                        <div className="min-w-0">

                            <h1 className="break-words text-3xl font-bold tracking-tight text-[#1d1d1f]">

                                {openedFolder
                                    ? openedFolder.name
                                    : "Trash"}

                            </h1>


                            <p className="mt-1 text-sm text-[#6e6e73]">

                                {openedFolder
                                    ? "Recently deleted files in this folder"
                                    : `${allItems.length} item${allItems.length !== 1 ? "s" : ""} in Trash`}

                            </p>

                        </div>

                    </div>


                    {!openedFolder &&
                        allItems.length > 0 && (

                            <div className="flex flex-wrap items-center gap-3">


                                <button
                                    onClick={() =>
                                        setShowRestoreAllConfirm(
                                            true
                                        )
                                    }
                                    className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 active:scale-95"
                                >
                                    Restore All
                                </button>


                                <button
                                    onClick={() =>
                                        setShowEmptyConfirm(
                                            true
                                        )
                                    }
                                    className="rounded-full bg-[#ff3b30] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-95"
                                >
                                    Empty Trash
                                </button>

                            </div>

                        )}

                </div>


                {error && (

                    <div className="mb-6 break-words rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">

                        {error}

                    </div>

                )}


                {openedFolder ? (

                    <>

                        {folderLoading ? (

                            <div className="flex min-h-[400px] items-center justify-center">

                                <div className="flex flex-col items-center gap-4">

                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />

                                    <p className="text-sm text-slate-500">
                                        Opening folder...
                                    </p>

                                </div>

                            </div>

                        ) : folderFiles.length === 0 ? (

                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-black/[0.04]">

                                <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-blue-50 text-5xl">

                                    📁

                                </div>

                                <h2 className="mt-6 text-xl font-semibold text-[#1d1d1f]">

                                    This folder is empty

                                </h2>

                                <p className="mt-2 text-sm text-[#6e6e73]">

                                    There are no deleted files here.

                                </p>

                            </div>

                        ) : (

                            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">

                                {folderFiles.map(
                                    (
                                        file,
                                        index
                                    ) => (

                                        <div
                                            key={file.id}
                                            className={`flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                                                index !==
                                                folderFiles.length -
                                                1
                                                    ? "border-b border-slate-100"
                                                    : ""
                                            }`}
                                        >


                                            <button
                                                onClick={() =>
                                                    openPreview(
                                                        file
                                                    )
                                                }
                                                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                                            >


                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">

                                                    {isImage(
                                                        file
                                                    )
                                                        ? "🖼️"
                                                        : isVideo(
                                                            file
                                                        )
                                                        ? "🎥"
                                                        : "📄"}

                                                </div>


                                                <div className="min-w-0">

                                                    <p className="truncate font-semibold text-[#1d1d1f]">

                                                        {file.original_name}

                                                    </p>

                                                    <p className="mt-1 text-sm text-[#86868b]">

                                                        {getFileType(
                                                            file
                                                        )}

                                                        {" · "}

                                                        {formatFileSize(
                                                            file.size
                                                        )}

                                                    </p>

                                                </div>

                                            </button>


                                            <div className="flex shrink-0 items-center gap-3">


                                                <button
                                                    onClick={() =>
                                                        setRestoreItem({
                                                            ...file,
                                                            type: "file",
                                                        })
                                                    }
                                                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                                                >
                                                    Restore
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        setDeleteItem({
                                                            ...file,
                                                            type: "file",
                                                        })
                                                    }
                                                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-[#ff3b30] transition hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </>

                ) : (

                    <>

                        {allItems.length === 0 ? (

                            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[30px] bg-white p-10 text-center shadow-sm ring-1 ring-black/[0.04]">


                                <div className="flex h-28 w-28 items-center justify-center rounded-[35px] bg-slate-100 text-6xl">

                                    🗑️

                                </div>


                                <h2 className="mt-7 text-2xl font-bold tracking-tight text-[#1d1d1f]">

                                    Trash is empty

                                </h2>


                                <p className="mt-3 max-w-sm text-sm leading-6 text-[#86868b]">

                                    Deleted files and folders will appear here.

                                </p>

                            </div>

                        ) : (

                            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">


                                <div className="border-b border-slate-100 px-5 py-4">

                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">

                                        Recently Deleted

                                    </p>

                                </div>


                                {allItems.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className={`flex flex-col gap-4 px-5 py-5 transition hover:bg-[#f8f8fa] sm:flex-row sm:items-center sm:justify-between ${
                                                index !==
                                                allItems.length -
                                                1
                                                    ? "border-b border-slate-100"
                                                    : ""
                                            }`}
                                        >


                                            <button
                                                onClick={() => {

                                                    if (
                                                        item.type ===
                                                        "folder"
                                                    ) {

                                                        openFolder(
                                                            item
                                                        );

                                                    } else {

                                                        openPreview(
                                                            item
                                                        );

                                                    }

                                                }}
                                                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                                            >


                                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                                                    item.type ===
                                                    "folder"
                                                        ? "bg-blue-50"
                                                        : "bg-slate-100"
                                                }`}>

                                                    {item.type ===
                                                    "folder"
                                                        ? "📁"
                                                        : isImage(
                                                            item
                                                        )
                                                        ? "🖼️"
                                                        : isVideo(
                                                            item
                                                        )
                                                        ? "🎥"
                                                        : "📄"}

                                                </div>


                                                <div className="min-w-0">

                                                    <p className="truncate font-semibold text-[#1d1d1f] transition hover:text-blue-600">

                                                        {getItemName(
                                                            item
                                                        )}

                                                    </p>


                                                    <p className="mt-1 text-sm text-[#86868b]">

                                                        {item.type ===
                                                        "folder"
                                                            ? "Folder"
                                                            : `${getFileType(item)} · ${formatFileSize(item.size)}`}

                                                    </p>

                                                </div>

                                            </button>


                                            <div className="flex shrink-0 items-center gap-3">


                                                <button
                                                    onClick={() =>
                                                        setRestoreItem(
                                                            item
                                                        )
                                                    }
                                                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-95"
                                                >
                                                    Restore
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        setDeleteItem(
                                                            item
                                                        )
                                                    }
                                                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-[#ff3b30] transition hover:bg-red-100 active:scale-95"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </>

                )}

            </div>


            {previewFile && (

                <div
                    onClick={closePreview}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-xl sm:p-6"
                >

                    <div
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
                    >


                        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl sm:px-6">


                            <div className="flex min-w-0 items-center gap-4">


                                <button
                                    onClick={closePreview}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white shadow-lg transition hover:scale-105"
                                >
                                    ×
                                </button>


                                <div className="min-w-0">

                                    <p className="truncate text-sm font-semibold text-white sm:text-base">

                                        {previewFile.original_name}

                                    </p>


                                    <p className="text-xs text-slate-400">

                                        {formatFileSize(
                                            previewFile.size
                                        )}

                                    </p>

                                </div>

                            </div>


                            {isImage(
                                previewFile
                            ) && (

                                <div className="flex shrink-0 items-center gap-2">


                                    <button
                                        onClick={() =>
                                            setImageZoom(
                                                (
                                                    previous
                                                ) =>
                                                    Math.max(
                                                        0.5,
                                                        previous -
                                                        0.25
                                                    )
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
                                    >
                                        −
                                    </button>


                                    <button
                                        onClick={() =>
                                            setImageZoom(
                                                1
                                            )
                                        }
                                        className="hidden rounded-full bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20 sm:block"
                                    >
                                        {Math.round(
                                            imageZoom *
                                            100
                                        )}%
                                    </button>


                                    <button
                                        onClick={() =>
                                            setImageZoom(
                                                (
                                                    previous
                                                ) =>
                                                    Math.min(
                                                        3,
                                                        previous +
                                                        0.25
                                                    )
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
                                    >
                                        +
                                    </button>

                                </div>

                            )}

                        </div>


                        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/30 p-4 sm:p-8">


                            {previewItems.length > 1 && (

                                <button
                                    onClick={
                                        openPreviousPreview
                                    }
                                    className="absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/70 sm:left-6"
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

                                isImage(
                                    previewFile
                                ) ? (

                                    <div className="flex h-full w-full items-center justify-center overflow-auto">

                                        <img
                                            src={
                                                previewUrl
                                            }
                                            alt={
                                                previewFile.original_name
                                            }
                                            style={{
                                                transform:
                                                    `scale(${imageZoom})`,
                                            }}
                                            className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
                                        />

                                    </div>

                                ) : isVideo(
                                    previewFile
                                ) ? (

                                    <video
                                        src={
                                            previewUrl
                                        }
                                        controls
                                        autoPlay
                                        className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl"
                                    />

                                ) : null

                            ) : null}


                            {previewItems.length > 1 && (

                                <button
                                    onClick={
                                        openNextPreview
                                    }
                                    className="absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/70 sm:right-6"
                                >
                                    ›
                                </button>

                            )}

                        </div>


                        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-400 backdrop-blur-xl">

                            <span>

                                {currentPreviewIndex >=
                                0
                                    ? `${currentPreviewIndex + 1} of ${previewItems.length}`
                                    : ""}

                            </span>


                            <span className="hidden sm:block">

                                ← → Navigate
                                &nbsp; • &nbsp;
                                ESC Close

                            </span>

                        </div>

                    </div>

                </div>

            )}


            {restoreItem && (

                <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md">

                    <div className="my-auto w-full max-w-md overflow-hidden rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">


                        <h2 className="text-xl font-bold text-[#1d1d1f]">

                            Restore {restoreItem.type}?

                        </h2>


                        <div className="mt-3 max-h-[45vh] overflow-y-auto pr-1">

                            <p className="text-sm leading-6 text-[#6e6e73]">

                                Are you sure you want to restore{" "}

                                <span className="block break-all font-semibold text-[#1d1d1f]">

                                    {getItemName(
                                        restoreItem
                                    )}

                                </span>

                                ?

                            </p>

                        </div>


                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">


                            <button
                                onClick={() =>
                                    setRestoreItem(
                                        null
                                    )
                                }
                                className="w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    handleRestore
                                }
                                disabled={
                                    actionLoading
                                }
                                className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                            >
                                Restore
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {deleteItem && (

                <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md">

                    <div className="my-auto w-full max-w-md overflow-hidden rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">


                        <h2 className="text-xl font-bold text-[#1d1d1f]">

                            Permanently delete?

                        </h2>


                        <div className="mt-3 max-h-[45vh] overflow-y-auto pr-1">

                            <p className="text-sm leading-6 text-[#6e6e73]">

                                <span className="block break-all font-semibold text-[#1d1d1f]">

                                    {getItemName(
                                        deleteItem
                                    )}

                                </span>

                                <span className="mt-2 block">

                                    will be permanently deleted.
                                    This action cannot be undone.

                                </span>

                            </p>

                        </div>


                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">


                            <button
                                onClick={() =>
                                    setDeleteItem(
                                        null
                                    )
                                }
                                className="w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    handlePermanentDelete
                                }
                                disabled={
                                    actionLoading
                                }
                                className="w-full rounded-full bg-[#ff3b30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {showRestoreAllConfirm && (

                <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md">

                    <div className="my-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">


                        <h2 className="text-xl font-bold text-[#1d1d1f]">

                            Restore all items?

                        </h2>


                        <p className="mt-3 text-sm leading-6 text-[#6e6e73]">

                            Are you sure you want to restore{" "}

                            <span className="font-semibold text-[#1d1d1f]">

                                {allItems.length}

                            </span>{" "}

                            items?

                        </p>


                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">


                            <button
                                onClick={() =>
                                    setShowRestoreAllConfirm(
                                        false
                                    )
                                }
                                className="w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    handleRestoreAll
                                }
                                disabled={
                                    actionLoading
                                }
                                className="w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                            >
                                Restore All
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {showEmptyConfirm && (

                <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md">

                    <div className="my-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">


                        <h2 className="text-xl font-bold text-[#1d1d1f]">

                            Empty Trash?

                        </h2>


                        <p className="mt-3 text-sm leading-6 text-[#6e6e73]">

                            All items will be permanently deleted.
                            This action cannot be undone.

                        </p>


                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">


                            <button
                                onClick={() =>
                                    setShowEmptyConfirm(
                                        false
                                    )
                                }
                                className="w-full rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    handleEmptyTrash
                                }
                                disabled={
                                    actionLoading
                                }
                                className="w-full rounded-full bg-[#ff3b30] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                            >
                                Empty Trash
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default Trash;
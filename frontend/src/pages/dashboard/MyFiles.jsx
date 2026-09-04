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
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaImage,
  FaLink,
  FaSearch,
  FaShareAlt,
  FaTimes,
  FaTrash,
  FaUserPlus,
  FaVideo,
} from "react-icons/fa";

import mammoth from "mammoth";

import api, {
  getPublicShareUrl,
} from "../../services/api";


function MyFiles() {

  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);

  const downloadCancelRef =
    useRef(null);


  const [files, setFiles] =
    useState([]);

  const [folders, setFolders] =
    useState([]);

  const [selectedFolder, setSelectedFolder] =
    useState(null);

  const [searchQuery, setSearchQuery] =
    useState("");


  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);


  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [documentContent, setDocumentContent] =
    useState("");

  const [previewType, setPreviewType] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [previewError, setPreviewError] =
    useState("");

  const [imageZoom, setImageZoom] =
    useState(1);


  const [shareFile, setShareFile] =
    useState(null);

  const [shareEmail, setShareEmail] =
    useState("");

  const [shareRole, setShareRole] =
    useState("viewer");

  const [sharingData, setSharingData] =
    useState(null);

  const [shareLoading, setShareLoading] =
    useState(false);

  const [shareError, setShareError] =
    useState("");

  const [shareSuccess, setShareSuccess] =
    useState("");


  const [confirmModal, setConfirmModal] =
    useState(null);


  const [downloading, setDownloading] =
    useState(false);

  const [downloadFile, setDownloadFile] =
    useState(null);

  const [downloadProgress, setDownloadProgress] =
    useState(0);

  const [downloadLoaded, setDownloadLoaded] =
    useState(0);

  const [downloadTotal, setDownloadTotal] =
    useState(0);


  const getFileName =
    (
      file
    ) => {

      return (
        file?.original_name ||
        file?.name ||
        ""
      );

    };


  const getFileFolderId =
    (
      file
    ) => {

      if (
        !file
      ) {

        return null;

      }


      if (
        file.folder_id !== undefined &&
        file.folder_id !== null
      ) {

        return file.folder_id;

      }


      if (
        file.folderId !== undefined &&
        file.folderId !== null
      ) {

        return file.folderId;

      }


      if (
        file.folder?.id !== undefined &&
        file.folder?.id !== null
      ) {

        return file.folder.id;

      }


      return null;

    };


  const getFileExtension =
    (
      file
    ) => {

      const name =
        getFileName(
          file
        );

      const parts =
        name.split(
          "."
        );

      if (
        parts.length < 2
      ) {

        return "";

      }

      return parts
        .pop()
        .toLowerCase();

    };


  const getMimeType =
    (
      file
    ) => {

      return (
        file?.mime_type ||
        file?.mimeType ||
        ""
      ).toLowerCase();

    };


  const isImage =
    (
      file
    ) =>
      getMimeType(
        file
      ).startsWith(
        "image/"
      );


  const isVideo =
    (
      file
    ) =>
      getMimeType(
        file
      ).startsWith(
        "video/"
      );


  const isPdf =
    (
      file
    ) =>
      getMimeType(
        file
      ) ===
        "application/pdf" ||
      getFileExtension(
        file
      ) ===
        "pdf";


  const isDocx =
    (
      file
    ) =>
      getMimeType(
        file
      ).includes(
        "wordprocessingml"
      ) ||
      getFileExtension(
        file
      ) ===
        "docx";


  const isTextFile =
    (
      file
    ) => {

      const mimeType =
        getMimeType(
          file
        );

      const extension =
        getFileExtension(
          file
        );

      return (
        mimeType.startsWith(
          "text/"
        ) ||
        [
          "txt",
          "csv",
          "json",
          "js",
          "jsx",
          "ts",
          "tsx",
          "html",
          "css",
          "py",
          "java",
          "cpp",
          "c",
          "md",
        ].includes(
          extension
        )
      );

    };


  const getPreviewType =
    (
      file
    ) => {

      if (
        isImage(
          file
        )
      ) {

        return "image";

      }


      if (
        isVideo(
          file
        )
      ) {

        return "video";

      }


      if (
        isPdf(
          file
        )
      ) {

        return "pdf";

      }


      if (
        isDocx(
          file
        )
      ) {

        return "docx";

      }


      if (
        isTextFile(
          file
        )
      ) {

        return "text";

      }


      return "unsupported";

    };


  const loadData =
    async () => {

      try {

        setLoading(
          true
        );

        setError(
          ""
        );


        const [
          filesResponse,
          foldersResponse,
        ] =
          await Promise.all([

            api.get(
              "/files/"
            ),

            api.get(
              "/folders/"
            ),

          ]);


        const filesData =
          Array.isArray(
            filesResponse.data
          )
            ? filesResponse.data
            : (
              filesResponse.data?.files ||
              filesResponse.data?.data ||
              []
            );


        const foldersData =
          Array.isArray(
            foldersResponse.data
          )
            ? foldersResponse.data
            : (
              foldersResponse.data?.folders ||
              foldersResponse.data?.data ||
              []
            );


        setFiles(
          filesData
        );

        setFolders(
          foldersData
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to load your files."
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  useEffect(
    () => {

      loadData();

    },
    []
  );


  useEffect(
    () => {

      return () => {

        if (
          previewUrl
        ) {

          URL.revokeObjectURL(
            previewUrl
          );

        }

      };

    },
    [
      previewUrl
    ]
  );


  const currentFolderFiles =
    useMemo(
      () => {

        if (
          !selectedFolder
        ) {

          return files.filter(
            (
              file
            ) =>
              !getFileFolderId(
                file
              )
          );

        }


        return files.filter(
          (
            file
          ) =>
            String(
              getFileFolderId(
                file
              )
            ) ===
            String(
              selectedFolder.id
            )
        );

      },
      [
        files,
        selectedFolder,
      ]
    );


  const previewItems =
    useMemo(
      () => {

        return currentFolderFiles.filter(
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
        currentFolderFiles
      ]
    );


  const currentPreviewIndex =
    selectedFile
      ? previewItems.findIndex(
          (
            file
          ) =>
            file.id ===
            selectedFile.id
        )
      : -1;


  const formatBytes =
    (
      bytes = 0
    ) => {

      if (
        !bytes ||
        bytes === 0
      ) {

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
          1
        )
      )} ${sizes[index]}`;

    };


  const getFileCategory =
    (
      file
    ) => {

      if (
        isImage(
          file
        )
      ) {

        return "image";

      }


      if (
        isVideo(
          file
        )
      ) {

        return "video";

      }


      if (
        isPdf(
          file
        )
      ) {

        return "pdf";

      }


      if (
        isDocx(
          file
        )
      ) {

        return "document";

      }


      if (
        isTextFile(
          file
        )
      ) {

        return "text";

      }


      return "document";

    };


  const getFileIcon =
    (
      file
    ) => {

      const category =
        getFileCategory(
          file
        );


      if (
        category ===
        "image"
      ) {

        return (
          <FaImage className="text-xl text-purple-500" />
        );

      }


      if (
        category ===
        "video"
      ) {

        return (
          <FaVideo className="text-xl text-red-500" />
        );

      }


      return (
        <FaFileAlt className="text-xl text-blue-500" />
      );

    };


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

      setDocumentContent(
        ""
      );

      setPreviewType(
        ""
      );

      setSelectedFile(
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

      const type =
        getPreviewType(
          file
        );


      if (
        type ===
        "unsupported"
      ) {

        setError(
          "Preview is not available for this file type. Please download the file to open it."
        );

        return;

      }


      try {

        setPreviewLoading(
          true
        );

        setPreviewError(
          ""
        );

        setDocumentContent(
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

        setPreviewType(
          type
        );

        setSelectedFile(
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


        const blob =
          response.data;


        if (
          type ===
          "docx"
        ) {

          const arrayBuffer =
            await blob.arrayBuffer();


          const result =
            await mammoth.convertToHtml({
              arrayBuffer,
            });


          setDocumentContent(
            result.value ||
            "<p>This document is empty.</p>"
          );

        } else if (
          type ===
          "text"
        ) {

          const text =
            await blob.text();


          setDocumentContent(
            text ||
            "This file is empty."
          );

        } else {

          const objectUrl =
            URL.createObjectURL(
              blob
            );


          setPreviewUrl(
            objectUrl
          );

        }

      } catch (
        err
      ) {

        console.error(
          err
        );

        setPreviewError(
          err.response?.data?.detail ||
          "Unable to open preview."
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


  useEffect(
    () => {

      const handleKeyboard =
        (
          event
        ) => {

          if (
            !selectedFile
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
              "ArrowRight" &&
            previewItems.length >
              1
          ) {

            openNextPreview();

          }


          if (
            event.key ===
              "ArrowLeft" &&
            previewItems.length >
              1
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

    },
    [
      selectedFile,
      previewItems,
      currentPreviewIndex,
      previewUrl,
    ]
  );


  const filteredFiles =
    useMemo(
      () => {

        if (
          !searchQuery.trim()
        ) {

          return currentFolderFiles;

        }


        const query =
          searchQuery.toLowerCase();


        return currentFolderFiles.filter(
          (
            file
          ) =>
            getFileName(
              file
            )
              .toLowerCase()
              .includes(
                query
              )
        );

      },
      [
        currentFolderFiles,
        searchQuery,
      ]
    );


  const visibleFolders =
    useMemo(
      () => {

        if (
          selectedFolder
        ) {

          return [];

        }


        if (
          !searchQuery.trim()
        ) {

          return folders;

        }


        const query =
          searchQuery.toLowerCase();


        return folders.filter(
          (
            folder
          ) =>
            (
              folder.name ||
              ""
            )
              .toLowerCase()
              .includes(
                query
              )
        );

      },
      [
        folders,
        selectedFolder,
        searchQuery,
      ]
    );


  const getFolderFileCount =
    (
      folderId
    ) => {

      return files.filter(
        (
          file
        ) =>
          String(
            getFileFolderId(
              file
            )
          ) ===
          String(
            folderId
          )
      ).length;

    };


  const handleOpenFolder =
    (
      folder
    ) => {

      setSelectedFolder(
        folder
      );

      setSearchQuery(
        ""
      );

    };


  const handleGoToMyDrive =
    () => {

      setSelectedFolder(
        null
      );

      setSearchQuery(
        ""
      );

    };


  const handleUploadClick =
    () => {

      fileInputRef.current?.click();

    };


  const handleFileUpload =
    async (
      event
    ) => {

      const selected =
        event.target.files?.[0];


      if (
        !selected
      ) {

        return;

      }


      try {

        setUploading(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );


        const formData =
          new FormData();


        formData.append(
          "file",
          selected
        );


        if (
          selectedFolder?.id
        ) {

          formData.append(
            "folder_id",
            selectedFolder.id
          );

        }


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
          `"${selected.name}" uploaded successfully.`
        );


        await loadData();

      } catch (
        err
      ) {

        console.error(
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to upload file."
        );

      } finally {

        setUploading(
          false
        );

        event.target.value =
          "";

      }

    };


  const openDownloadConfirmation =
    (
      file
    ) => {

      setConfirmModal({
        type:
          "download",
        file,
      });

    };


  const openDeleteConfirmation =
    (
      file
    ) => {

      setConfirmModal({
        type:
          "delete",
        file,
      });

    };


  const closeConfirmation =
    () => {

      if (
        downloading
      ) {

        return;

      }


      setConfirmModal(
        null
      );

    };


  const handleDownload =
    async (
      file
    ) => {

      setConfirmModal(
        null
      );

      setDownloadFile(
        file
      );

      setDownloadProgress(
        0
      );

      setDownloadLoaded(
        0
      );

      setDownloadTotal(
        Number(
          file.size
        ) || 0
      );

      setDownloading(
        true
      );

      setError(
        ""
      );


      const controller =
        new AbortController();


      downloadCancelRef.current =
        controller;


      try {

        const response =
          await api.get(
            `/files/${file.id}/download`,
            {
              responseType:
                "blob",

              signal:
                controller.signal,

              onDownloadProgress:
                (
                  progressEvent
                ) => {

                  const loaded =
                    progressEvent.loaded ||
                    0;


                  const total =
                    progressEvent.total ||
                    Number(
                      file.size
                    ) ||
                    0;


                  setDownloadLoaded(
                    loaded
                  );

                  setDownloadTotal(
                    total
                  );


                  if (
                    total > 0
                  ) {

                    setDownloadProgress(
                      Math.round(
                        (
                          loaded /
                          total
                        ) *
                        100
                      )
                    );

                  }

                },

            }
          );


        setDownloadProgress(
          100
        );


        const url =
          window.URL.createObjectURL(
            new Blob([
              response.data,
            ])
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;

        link.setAttribute(
          "download",
          getFileName(
            file
          )
        );


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        setTimeout(
          () => {

            window.URL.revokeObjectURL(
              url
            );

          },
          1000
        );


        setSuccess(
          `"${getFileName(file)}" downloaded successfully.`
        );

      } catch (
        err
      ) {

        if (
          err.name ===
            "CanceledError" ||
          err.code ===
            "ERR_CANCELED"
        ) {

          setSuccess(
            "Download cancelled."
          );

        } else {

          console.error(
            err
          );

          setError(
            "Unable to download file."
          );

        }

      } finally {

        setDownloading(
          false
        );

        setDownloadFile(
          null
        );

        setDownloadProgress(
          0
        );

        setDownloadLoaded(
          0
        );

        setDownloadTotal(
          0
        );

        downloadCancelRef.current =
          null;

      }

    };


  const cancelDownload =
    () => {

      if (
        downloadCancelRef.current
      ) {

        downloadCancelRef.current.abort();

      }

    };


  const handleDelete =
    async (
      file
    ) => {

      setConfirmModal(
        null
      );


      try {

        setError(
          ""
        );

        setSuccess(
          ""
        );


        await api.delete(
          `/files/${file.id}`
        );


        setFiles(
          (
            previousFiles
          ) =>
            previousFiles.filter(
              (
                item
              ) =>
                item.id !==
                file.id
            )
        );


        if (
          selectedFile?.id ===
          file.id
        ) {

          closePreview();

        }


        if (
          shareFile?.id ===
          file.id
        ) {

          setShareFile(
            null
          );

        }


        setSuccess(
          `"${getFileName(file)}" moved to trash.`
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setError(
          err.response?.data?.detail ||
          "Unable to move file to trash."
        );

      }

    };


  const getFolderName =
    (
      folderId
    ) => {

      if (
        folderId === null ||
        folderId === undefined
      ) {

        return "My Drive";

      }


      const folder =
        folders.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              folderId
            )
        );


      return (
        folder?.name ||
        "My Drive"
      );

    };


  const loadSharingData =
    async (
      fileId
    ) => {

      try {

        setShareLoading(
          true
        );

        setShareError(
          ""
        );


        const response =
          await api.get(
            `/shares/files/${fileId}`
          );


        setSharingData(
          response.data
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setShareError(
          err.response?.data?.detail ||
          "Unable to load sharing information."
        );

      } finally {

        setShareLoading(
          false
        );

      }

    };


  const handleOpenShare =
    async (
      file
    ) => {

      setShareFile(
        file
      );

      setShareEmail(
        ""
      );

      setShareRole(
        "viewer"
      );

      setSharingData(
        null
      );

      setShareError(
        ""
      );

      setShareSuccess(
        ""
      );


      await loadSharingData(
        file.id
      );

    };


  const handleCloseShare =
    () => {

      setShareFile(
        null
      );

      setSharingData(
        null
      );

      setShareEmail(
        ""
      );

      setShareError(
        ""
      );

      setShareSuccess(
        ""
      );

    };


  const handleShareWithUser =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !shareFile ||
        !shareEmail.trim()
      ) {

        return;

      }


      try {

        setShareLoading(
          true
        );

        setShareError(
          ""
        );

        setShareSuccess(
          ""
        );


        await api.post(
          `/shares/files/${shareFile.id}`,
          {
            email:
              shareEmail.trim(),
            role:
              shareRole,
          }
        );


        setShareEmail(
          ""
        );

        setShareRole(
          "viewer"
        );


        setShareSuccess(
          "File shared successfully."
        );


        await loadSharingData(
          shareFile.id
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setShareError(
          err.response?.data?.detail ||
          "Unable to share file."
        );

      } finally {

        setShareLoading(
          false
        );

      }

    };


  const handleRemoveSharedUser =
    async (
      userId
    ) => {

      if (
        !shareFile
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          "Remove this user's access?"
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        setShareLoading(
          true
        );

        setShareError(
          ""
        );

        setShareSuccess(
          ""
        );


        await api.delete(
          `/shares/files/${shareFile.id}/users/${userId}`
        );


        setShareSuccess(
          "User access removed."
        );


        await loadSharingData(
          shareFile.id
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setShareError(
          err.response?.data?.detail ||
          "Unable to remove user access."
        );

      } finally {

        setShareLoading(
          false
        );

      }

    };


  const handleLinkAccessChange =
    async (
      accessType
    ) => {

      if (
        !shareFile
      ) {

        return;

      }


      try {

        setShareLoading(
          true
        );

        setShareError(
          ""
        );

        setShareSuccess(
          ""
        );


        const response =
          await api.put(
            `/shares/files/${shareFile.id}/link`,
            {
              access_type:
                accessType,
            }
          );


        setSharingData(
          (
            previous
          ) => ({
            ...previous,
            access_type:
              response.data.access_type,
            share_token:
              response.data.token,
          })
        );


        setShareSuccess(
          accessType ===
            "anyone_with_link"
            ? "Anyone with the link can now access this file."
            : "Link access is now restricted."
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setShareError(
          err.response?.data?.detail ||
          "Unable to update link access."
        );

      } finally {

        setShareLoading(
          false
        );

      }

    };


  const handleCopyShareLink =
    async () => {

      if (
        !sharingData?.share_token
      ) {

        return;

      }


      try {

        const shareUrl =
          getPublicShareUrl(
            sharingData.share_token
          );


        await navigator.clipboard.writeText(
          shareUrl
        );


        setShareSuccess(
          "Share link copied to clipboard."
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setShareError(
          "Unable to copy share link."
        );

      }

    };


  if (
    loading
  ) {

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
        onChange={
          handleFileUpload
        }
      />


      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-[72px] max-w-[1250px] items-center justify-between gap-6 px-6">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
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
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder={
                  selectedFolder
                    ? `Search in ${selectedFolder.name}...`
                    : "Search files and folders..."
                }
                className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-200"
              />

            </div>


            <button
              type="button"
              onClick={
                handleUploadClick
              }
              disabled={
                uploading
              }
              className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >

              <FaCloudUploadAlt />

              {uploading
                ? "Uploading..."
                : "Upload"}

            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-[1250px] px-6 py-8">

        {error && (

          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(
                  ""
                )
              }
            >
              <FaTimes />
            </button>

          </div>

        )}


        {success && (

          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess(
                  ""
                )
              }
            >
              <FaTimes />
            </button>

          </div>

        )}


        <div className="mb-6">

          <div className="mb-4 flex items-end justify-between">

            <div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                CloudVault
              </p>


              <div className="flex items-center gap-3">

                {selectedFolder && (

                  <button
                    type="button"
                    onClick={
                      handleGoToMyDrive
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                  >
                    <FaArrowLeft />
                  </button>

                )}


                <div>

                  <div className="mb-1 flex items-center gap-2 text-sm">

                    <button
                      type="button"
                      onClick={
                        handleGoToMyDrive
                      }
                      className={`font-medium ${
                        selectedFolder
                          ? "text-blue-600 hover:underline"
                          : "text-slate-500"
                      }`}
                    >
                      My Drive
                    </button>


                    {selectedFolder && (

                      <>

                        <span className="text-slate-400">
                          /
                        </span>

                        <span className="font-semibold text-slate-700">
                          {selectedFolder.name}
                        </span>

                      </>

                    )}

                  </div>


                  <h2 className="text-2xl font-bold text-slate-800">

                    {selectedFolder
                      ? selectedFolder.name
                      : "All Files"}

                  </h2>


                  <p className="mt-1 text-sm text-slate-500">

                    {filteredFiles.length}{" "}

                    {filteredFiles.length ===
                    1
                      ? "file"
                      : "files"}

                    {selectedFolder
                      ? " in this folder"
                      : " available"}

                  </p>

                </div>

              </div>

            </div>


            <div className="flex items-center gap-2 text-sm text-slate-500">

              <FaFolder className="text-orange-500" />

              <span>
                {folders.length} folders
              </span>

            </div>

          </div>

        </div>


        {!selectedFolder &&
          visibleFolders.length > 0 && (

          <div className="mb-8">

            <div className="mb-4 flex items-center gap-2">

              <FaFolder className="text-orange-500" />

              <h3 className="text-lg font-bold text-slate-800">
                Folders
              </h3>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {visibleFolders.map(
                (
                  folder
                ) => (

                  <button
                    key={
                      folder.id
                    }
                    type="button"
                    onClick={() =>
                      handleOpenFolder(
                        folder
                      )
                    }
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >

                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50 transition group-hover:bg-orange-100">

                      <FaFolderOpen className="text-3xl text-orange-500" />

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="truncate font-bold text-slate-700">
                        {folder.name}
                      </p>


                      <p className="mt-1 text-xs text-slate-500">

                        {getFolderFileCount(
                          folder.id
                        )}{" "}

                        {getFolderFileCount(
                          folder.id
                        ) === 1
                          ? "file"
                          : "files"}

                      </p>

                    </div>


                    <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
                      ›
                    </span>

                  </button>

                )
              )}

            </div>

          </div>

        )}


        <div className="mb-4 flex items-center gap-2">

          <FaFileAlt className="text-blue-500" />

          <h3 className="text-lg font-bold text-slate-800">

            {selectedFolder
              ? "Files in Folder"
              : "Files"}

          </h3>

        </div>


        {filteredFiles.length ===
        0 ? (

          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            {selectedFolder ? (

              <FaFolderOpen className="mb-5 text-6xl text-orange-300" />

            ) : (

              <FaCloud className="mb-5 text-6xl text-slate-300" />

            )}


            <h3 className="text-xl font-bold text-slate-700">

              {searchQuery
                ? "No files found"
                : selectedFolder
                  ? "This folder is empty"
                  : "No files found"}

            </h3>


            <p className="mt-2 text-sm text-slate-500">

              {searchQuery
                ? "Try searching with a different name."
                : selectedFolder
                  ? "Upload a file while this folder is open."
                  : "Upload your first file to get started."}

            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="grid grid-cols-[minmax(0,1fr)_140px_120px_230px] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">

              <div>
                Name
              </div>

              <div>
                Folder
              </div>

              <div>
                Size
              </div>

              <div className="text-right">
                Actions
              </div>

            </div>


            {filteredFiles.map(
              (
                file
              ) => (

                <div
                  key={
                    file.id
                  }
                  className="grid grid-cols-[minmax(0,1fr)_140px_120px_230px] items-center border-b border-slate-100 px-6 py-4 last:border-b-0 transition hover:bg-slate-50"
                >

                  <button
                    type="button"
                    onClick={() =>
                      openPreview(
                        file
                      )
                    }
                    className="flex min-w-0 items-center gap-4 text-left"
                  >

                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">

                      {getFileIcon(
                        file
                      )}

                    </div>


                    <div className="min-w-0">

                      <p className="truncate font-semibold text-slate-700">

                        {getFileName(
                          file
                        )}

                      </p>


                      <p className="mt-1 text-xs text-slate-400">

                        {getFileCategory(
                          file
                        )}

                      </p>

                    </div>

                  </button>


                  <div className="truncate text-sm text-slate-500">

                    {getFolderName(
                      getFileFolderId(
                        file
                      )
                    )}

                  </div>


                  <div className="text-sm text-slate-500">

                    {formatBytes(
                      file.size
                    )}

                  </div>


                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenShare(
                          file
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-purple-600 transition hover:bg-purple-50"
                    >

                      <FaShareAlt />

                      Share

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        openPreview(
                          file
                        )
                      }
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Open
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        openDownloadConfirmation(
                          file
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                    >

                      <FaDownload />

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        openDeleteConfirmation(
                          file
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                    >

                      <FaTrash />

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </main>


      {confirmModal && (

        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="p-6">

              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  confirmModal.type ===
                  "delete"
                    ? "bg-red-100 text-red-500"
                    : "bg-blue-100 text-blue-600"
                }`}
              >

                {confirmModal.type ===
                "delete" ? (

                  <FaTrash className="text-xl" />

                ) : (

                  <FaDownload className="text-xl" />

                )}

              </div>


              <h2 className="text-xl font-bold text-slate-800">

                {confirmModal.type ===
                "delete"
                  ? "Move file to trash?"
                  : "Download file?"}

              </h2>


              <p className="mt-3 text-sm leading-6 text-slate-500">

                {confirmModal.type ===
                "delete"
                  ? `Are you sure you want to move "${getFileName(confirmModal.file)}" to trash?`
                  : `Do you want to download "${getFileName(confirmModal.file)}" (${formatBytes(confirmModal.file.size)})?`}

              </p>

            </div>


            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

              <button
                type="button"
                onClick={
                  closeConfirmation
                }
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={() => {

                  if (
                    confirmModal.type ===
                    "delete"
                  ) {

                    handleDelete(
                      confirmModal.file
                    );

                  } else {

                    handleDownload(
                      confirmModal.file
                    );

                  }

                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${
                  confirmModal.type ===
                  "delete"
                    ? "bg-red-500 shadow-red-200 hover:bg-red-600"
                    : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                }`}
              >

                {confirmModal.type ===
                "delete"
                  ? "Move to Trash"
                  : "Download"}

              </button>

            </div>

          </div>

        </div>

      )}


      {downloading &&
      downloadFile && (

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
                {getFileName(downloadFile)}
              </h2>


              <p className="mt-2 text-sm text-slate-500">

                {formatBytes(
                  downloadLoaded
                )}{" "}

                of{" "}

                {formatBytes(
                  downloadTotal ||
                  downloadFile.size
                )}

              </p>


              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">

                <div
                  style={{
                    width:
                      `${downloadProgress}%`,
                  }}
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                />

              </div>


              <button
                type="button"
                onClick={
                  cancelDownload
                }
                className="mt-7 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-500"
              >
                Cancel Download
              </button>

            </div>

          </div>

        </div>

      )}


      {selectedFile && (

        <div
          onClick={
            closePreview
          }
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xl sm:p-6"
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-slate-900 shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 sm:px-6">

              <div className="flex min-w-0 items-center gap-4">

                <button
                  type="button"
                  onClick={
                    closePreview
                  }
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-red-600"
                >
                  ×
                </button>


                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-white sm:text-base">

                    {getFileName(
                      selectedFile
                    )}

                  </p>

                  <p className="text-xs text-slate-400">

                    {formatBytes(
                      selectedFile.size
                    )}

                  </p>

                </div>

              </div>


              {previewType ===
              "image" && (

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setImageZoom(
                        (
                          previous
                        ) =>
                          Math.max(
                            0.5,
                            previous - 0.25
                          )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
                  >
                    −
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setImageZoom(
                        1
                      )
                    }
                    className="rounded-full bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20"
                  >

                    {Math.round(
                      imageZoom * 100
                    )}%

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setImageZoom(
                        (
                          previous
                        ) =>
                          Math.min(
                            3,
                            previous + 0.25
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

              {previewItems.length >
                1 &&
                (
                  previewType ===
                    "image" ||
                  previewType ===
                    "video"
                ) && (

                <button
                  type="button"
                  onClick={
                    openPreviousPreview
                  }
                  className="absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white transition hover:bg-black/80 sm:left-6"
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

              ) : previewType ===
                "image" &&
                previewUrl ? (

                <div className="flex h-full w-full items-center justify-center overflow-auto">

                  <img
                    src={previewUrl}
                    alt={getFileName(selectedFile)}
                    style={{
                      transform:
                        `scale(${imageZoom})`,
                    }}
                    className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
                  />

                </div>

              ) : previewType ===
                "video" &&
                previewUrl ? (

                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl"
                />

              ) : previewType ===
                "pdf" &&
                previewUrl ? (

                <iframe
                  src={previewUrl}
                  title={getFileName(selectedFile)}
                  className="h-full w-full rounded-2xl bg-white shadow-2xl"
                />

              ) : previewType ===
                "docx" ? (

                <div className="h-full w-full overflow-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-10">

                  <div
                    className="mx-auto max-w-4xl break-words text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html:
                        documentContent,
                    }}
                  />

                </div>

              ) : previewType ===
                "text" ? (

                <div className="h-full w-full overflow-auto rounded-2xl bg-slate-950 p-5 shadow-2xl">

                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-200">

                    {documentContent}

                  </pre>

                </div>

              ) : null}


              {previewItems.length >
                1 &&
                (
                  previewType ===
                    "image" ||
                  previewType ===
                    "video"
                ) && (

                <button
                  type="button"
                  onClick={
                    openNextPreview
                  }
                  className="absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white transition hover:bg-black/80 sm:right-6"
                >
                  ›
                </button>

              )}

            </div>


            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-400">

              <span>

                {currentPreviewIndex >= 0
                  ? `${currentPreviewIndex + 1} of ${previewItems.length}`
                  : previewType ===
                    "pdf"
                    ? "PDF Preview"
                    : previewType ===
                      "docx"
                      ? "Document Preview"
                      : previewType ===
                        "text"
                        ? "Text Preview"
                        : ""}

              </span>


              <span className="hidden sm:block">

                {previewItems.length > 1
                  ? "← → Navigate • ESC Close"
                  : "ESC Close"}

              </span>

            </div>

          </div>

        </div>

      )}


      {shareFile && (

        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/70 p-4">

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Share File
                </h2>

                <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                  {getFileName(shareFile)}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleCloseShare
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-500"
              >
                <FaTimes />
              </button>

            </div>


            <div className="overflow-y-auto p-6">

              {shareError && (

                <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                  <span>
                    {shareError}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setShareError("")
                    }
                  >
                    <FaTimes />
                  </button>

                </div>

              )}


              {shareSuccess && (

                <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">

                  <span>
                    {shareSuccess}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setShareSuccess("")
                    }
                  >
                    <FaTimes />
                  </button>

                </div>

              )}


              <form
                onSubmit={
                  handleShareWithUser
                }
                className="mb-8"
              >

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Add people
                </label>


                <div className="flex gap-2">

                  <div className="relative flex-1">

                    <FaUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(
                        event
                      ) =>
                        setShareEmail(
                          event.target.value
                        )
                      }
                      placeholder="Enter registered user email"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>


                  <select
                    value={shareRole}
                    onChange={(
                      event
                    ) =>
                      setShareRole(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none"
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
                    onClick={() =>
                      handleLinkAccessChange(
                        "restricted"
                      )
                    }
                    className={`flex w-full items-center justify-between border-b border-slate-200 px-4 py-4 text-left transition ${
                      sharingData?.access_type === "restricted"
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
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
                    onClick={() =>
                      handleLinkAccessChange(
                        "anyone_with_link"
                      )
                    }
                    className={`flex w-full items-center justify-between px-4 py-4 text-left transition ${
                      sharingData?.access_type === "anyone_with_link"
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
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


                {sharingData?.access_type ===
                  "anyone_with_link" &&
                  sharingData?.share_token && (

                    <div className="mt-4 flex gap-2">

                      <input
                        readOnly
                        value={
                          getPublicShareUrl(
                            sharingData.share_token
                          )
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                      />


                      <button
                        type="button"
                        onClick={
                          handleCopyShareLink
                        }
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


                {shareLoading &&
                !sharingData ? (

                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading sharing information...
                  </div>

                ) : sharingData?.shared_users?.length ? (

                  <div className="space-y-2">

                    {sharingData.shared_users.map(
                      (
                        user
                      ) => (

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
                              onClick={() =>
                                handleRemoveSharedUser(
                                  user.id
                                )
                              }
                              disabled={shareLoading}
                              className="text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                            >
                              Remove
                            </button>

                          </div>

                        </div>

                      )
                    )}

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
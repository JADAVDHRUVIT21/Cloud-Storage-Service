// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";

// import {
//   useNavigate,
// } from "react-router-dom";

// import {
//   FaArrowLeft,
//   FaDownload,
//   FaFileAlt,
//   FaImage,
//   FaSearch,
//   FaStar,
//   FaTimes,
//   FaVideo,
// } from "react-icons/fa";

// import api from "../../services/api";


// function Starred() {

//   const navigate =
//     useNavigate();

//   const previewRequestRef =
//     useRef(null);


//   const [files, setFiles] =
//     useState([]);

//   const [searchQuery, setSearchQuery] =
//     useState("");

//   const [loading, setLoading] =
//     useState(true);

//   const [error, setError] =
//     useState("");

//   const [success, setSuccess] =
//     useState("");

//   const [selectedFile, setSelectedFile] =
//     useState(null);

//   const [previewUrl, setPreviewUrl] =
//     useState("");

//   const [previewLoading, setPreviewLoading] =
//     useState(false);

//   const [previewError, setPreviewError] =
//     useState("");

//   const [imageZoom, setImageZoom] =
//     useState(1);


//   const getErrorMessage =
//     useCallback(
//       (err, fallbackMessage) => {

//         const detail =
//           err?.response?.data?.detail;


//         if (
//           typeof detail ===
//           "string"
//         ) {

//           return detail;

//         }


//         if (
//           Array.isArray(
//             detail
//           )
//         ) {

//           return detail
//             .map(
//               (
//                 item
//               ) =>
//                 item?.msg ||
//                 "Validation error"
//             )
//             .join(
//               ", "
//             );

//         }


//         if (
//           detail &&
//           typeof detail ===
//           "object"
//         ) {

//           return (
//             detail?.msg ||
//             JSON.stringify(
//               detail
//             )
//           );

//         }


//         return (
//           err?.message ||
//           fallbackMessage
//         );

//       },
//       []
//     );


//   const isImage =
//     useCallback(
//       (
//         file
//       ) =>
//         Boolean(
//           file?.mime_type?.startsWith(
//             "image/"
//           )
//         ),
//       []
//     );


//   const isVideo =
//     useCallback(
//       (
//         file
//       ) =>
//         Boolean(
//           file?.mime_type?.startsWith(
//             "video/"
//           )
//         ),
//       []
//     );


//   const loadStarredFiles =
//     useCallback(
//       async () => {

//         try {

//           setLoading(
//             true
//           );

//           setError(
//             ""
//           );


//           const response =
//             await api.get(
//               "/files/starred/"
//             );


//           setFiles(
//             Array.isArray(
//               response.data
//             )
//               ? response.data
//               : []
//           );

//         } catch (
//           err
//         ) {

//           console.error(
//             "Load starred files error:",
//             err
//           );


//           setError(
//             getErrorMessage(
//               err,
//               "Unable to load starred files."
//             )
//           );

//         } finally {

//           setLoading(
//             false
//           );

//         }

//       },
//       [
//         getErrorMessage
//       ]
//     );


//   useEffect(
//     () => {

//       loadStarredFiles();

//     },
//     [
//       loadStarredFiles
//     ]
//   );


//   useEffect(
//     () => {

//       return () => {

//         if (
//           previewRequestRef.current
//         ) {

//           previewRequestRef.current.abort();

//         }


//         if (
//           previewUrl
//         ) {

//           URL.revokeObjectURL(
//             previewUrl
//           );

//         }

//       };

//     },
//     [
//       previewUrl
//     ]
//   );


//   const getFileCategory =
//     (
//       file
//     ) => {

//       const type =
//         file?.mime_type ||
//         "";


//       if (
//         type.startsWith(
//           "image/"
//         )
//       ) {

//         return "image";

//       }


//       if (
//         type.startsWith(
//           "video/"
//         )
//       ) {

//         return "video";

//       }


//       return "document";

//     };


//   const getFileIcon =
//     (
//       file
//     ) => {

//       const category =
//         getFileCategory(
//           file
//         );


//       if (
//         category ===
//         "image"
//       ) {

//         return (
//           <FaImage className="text-xl text-purple-500" />
//         );

//       }


//       if (
//         category ===
//         "video"
//       ) {

//         return (
//           <FaVideo className="text-xl text-red-500" />
//         );

//       }


//       return (
//         <FaFileAlt className="text-xl text-blue-500" />
//       );

//     };


//   const formatBytes =
//     (
//       bytes = 0
//     ) => {

//       const value =
//         Number(
//           bytes
//         );


//       if (
//         !value ||
//         value <= 0
//       ) {

//         return "0 B";

//       }


//       const sizes = [
//         "B",
//         "KB",
//         "MB",
//         "GB",
//         "TB",
//       ];


//       const index =
//         Math.min(
//           Math.floor(
//             Math.log(
//               value
//             ) /
//             Math.log(
//               1024
//             )
//           ),
//           sizes.length -
//           1
//         );


//       const formattedValue =
//         value /
//         Math.pow(
//           1024,
//           index
//         );


//       return `${parseFloat(
//         formattedValue.toFixed(
//           1
//         )
//       )} ${sizes[index]}`;

//     };


//   const filteredFiles =
//     useMemo(
//       () => {

//         if (
//           !searchQuery.trim()
//         ) {

//           return files;

//         }


//         const query =
//           searchQuery
//             .toLowerCase()
//             .trim();


//         return files.filter(
//           (
//             file
//           ) =>
//             (
//               file.original_name ||
//               ""
//             )
//               .toLowerCase()
//               .includes(
//                 query
//               )
//         );

//       },
//       [
//         files,
//         searchQuery,
//       ]
//     );


//   const previewItems =
//     useMemo(
//       () =>
//         files.filter(
//           (
//             file
//           ) =>
//             isImage(
//               file
//             ) ||
//             isVideo(
//               file
//             )
//         ),
//       [
//         files,
//         isImage,
//         isVideo,
//       ]
//     );


//   const currentPreviewIndex =
//     selectedFile
//       ? previewItems.findIndex(
//           (
//             file
//           ) =>
//             file.id ===
//             selectedFile.id
//         )
//       : -1;


//   const closePreview =
//     useCallback(
//       () => {

//         if (
//           previewRequestRef.current
//         ) {

//           previewRequestRef.current.abort();

//           previewRequestRef.current =
//             null;

//         }


//         setPreviewUrl(
//           (
//             previousUrl
//           ) => {

//             if (
//               previousUrl
//             ) {

//               URL.revokeObjectURL(
//                 previousUrl
//               );

//             }


//             return "";

//           }
//         );


//         setSelectedFile(
//           null
//         );

//         setPreviewLoading(
//           false
//         );

//         setPreviewError(
//           ""
//         );

//         setImageZoom(
//           1
//         );

//       },
//       []
//     );


//   const openPreview =
//     useCallback(
//       async (
//         file
//       ) => {

//         if (
//           !isImage(
//             file
//           ) &&
//           !isVideo(
//             file
//           )
//         ) {

//           return;

//         }


//         try {

//           if (
//             previewRequestRef.current
//           ) {

//             previewRequestRef.current.abort();

//           }


//           const controller =
//             new AbortController();


//           previewRequestRef.current =
//             controller;


//           setSelectedFile(
//             file
//           );

//           setPreviewLoading(
//             true
//           );

//           setPreviewError(
//             ""
//           );

//           setImageZoom(
//             1
//           );


//           setPreviewUrl(
//             (
//               previousUrl
//             ) => {

//               if (
//                 previousUrl
//               ) {

//                 URL.revokeObjectURL(
//                   previousUrl
//                 );

//               }


//               return "";

//             }
//           );


//           const response =
//             await api.get(
//               `/files/${file.id}/preview`,
//               {
//                 responseType:
//                   "blob",

//                 signal:
//                   controller.signal,
//               }
//             );


//           if (
//             previewRequestRef.current !==
//             controller
//           ) {

//             return;

//           }


//           const objectUrl =
//             URL.createObjectURL(
//               response.data
//             );


//           setPreviewUrl(
//             objectUrl
//           );

//         } catch (
//           err
//         ) {

//           if (
//             err?.name ===
//             "CanceledError" ||
//             err?.code ===
//             "ERR_CANCELED"
//           ) {

//             return;

//           }


//           console.error(
//             "Preview error:",
//             err
//           );


//           setPreviewError(
//             "Unable to open preview."
//           );

//         } finally {

//           if (
//             previewRequestRef.current
//           ) {

//             setPreviewLoading(
//               false
//             );

//           }

//         }

//       },
//       [
//         isImage,
//         isVideo,
//       ]
//     );


//   const openNextPreview =
//     useCallback(
//       () => {

//         if (
//           previewItems.length ===
//           0 ||
//           currentPreviewIndex ===
//           -1
//         ) {

//           return;

//         }


//         const nextIndex =
//           (
//             currentPreviewIndex +
//             1
//           ) %
//           previewItems.length;


//         openPreview(
//           previewItems[
//             nextIndex
//           ]
//         );

//       },
//       [
//         currentPreviewIndex,
//         openPreview,
//         previewItems,
//       ]
//     );


//   const openPreviousPreview =
//     useCallback(
//       () => {

//         if (
//           previewItems.length ===
//           0 ||
//           currentPreviewIndex ===
//           -1
//         ) {

//           return;

//         }


//         const previousIndex =
//           (
//             currentPreviewIndex -
//             1 +
//             previewItems.length
//           ) %
//           previewItems.length;


//         openPreview(
//           previewItems[
//             previousIndex
//           ]
//         );

//       },
//       [
//         currentPreviewIndex,
//         openPreview,
//         previewItems,
//       ]
//     );


//   useEffect(
//     () => {

//       const handleKeyboard =
//         (
//           event
//         ) => {

//           if (
//             !selectedFile
//           ) {

//             return;

//           }


//           if (
//             event.key ===
//             "Escape"
//           ) {

//             closePreview();

//           }


//           if (
//             event.key ===
//             "ArrowRight"
//           ) {

//             openNextPreview();

//           }


//           if (
//             event.key ===
//             "ArrowLeft"
//           ) {

//             openPreviousPreview();

//           }

//         };


//       window.addEventListener(
//         "keydown",
//         handleKeyboard
//       );


//       return () => {

//         window.removeEventListener(
//           "keydown",
//           handleKeyboard
//         );

//       };

//     },
//     [
//       closePreview,
//       openNextPreview,
//       openPreviousPreview,
//       selectedFile,
//     ]
//   );


//   const handleDownload =
//     async (
//       file
//     ) => {

//       try {

//         setError(
//           ""
//         );


//         const response =
//           await api.get(
//             `/files/${file.id}/download`,
//             {
//               responseType:
//                 "blob",
//             }
//           );


//         const url =
//           window.URL.createObjectURL(
//             response.data
//           );


//         const link =
//           document.createElement(
//             "a"
//           );


//         link.href =
//           url;


//         link.setAttribute(
//           "download",
//           file.original_name ||
//           "download"
//         );


//         document.body.appendChild(
//           link
//         );


//         link.click();


//         link.remove();


//         window.URL.revokeObjectURL(
//           url
//         );

//       } catch (
//         err
//       ) {

//         console.error(
//           "Download error:",
//           err
//         );


//         setError(
//           "Unable to download file."
//         );

//       }

//     };


//   const handleRemoveStar =
//     async (
//       file
//     ) => {

//       try {

//         setError(
//           ""
//         );

//         setSuccess(
//           ""
//         );


//         await api.put(
//           `/files/${file.id}/star`
//         );


//         setFiles(
//           (
//             previousFiles
//           ) =>
//             previousFiles.filter(
//               (
//                 item
//               ) =>
//                 item.id !==
//                 file.id
//             )
//         );


//         if (
//           selectedFile?.id ===
//           file.id
//         ) {

//           closePreview();

//         }


//         setSuccess(
//           `"${file.original_name}" removed from Starred.`
//         );

//       } catch (
//         err
//       ) {

//         console.error(
//           "Remove star error:",
//           err
//         );


//         setError(
//           getErrorMessage(
//             err,
//             "Unable to remove file from Starred."
//           )
//         );

//       }

//     };


//   if (
//     loading
//   ) {

//     return (

//       <div className="flex min-h-screen items-center justify-center bg-slate-100">

//         <div className="flex flex-col items-center">

//           <FaStar className="mb-4 animate-pulse text-5xl text-yellow-400" />

//           <p className="text-lg font-semibold text-slate-600">

//             Loading starred files...

//           </p>

//         </div>

//       </div>

//     );

//   }


//   return (

//     <div className="min-h-screen bg-slate-100">


//       <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">

//         <div className="mx-auto flex h-[72px] max-w-[1250px] items-center justify-between gap-6 px-6">


//           <div className="flex items-center gap-4">


//             <button
//               type="button"
//               onClick={() =>
//                 navigate(
//                   "/dashboard"
//                 )
//               }
//               className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
//             >

//               <FaArrowLeft />

//             </button>


//             <div>

//               <h1 className="text-xl font-bold text-slate-800">

//                 Starred

//               </h1>

//               <p className="text-xs text-slate-500">

//                 Files you marked as important

//               </p>

//             </div>

//           </div>


//           <div className="relative w-full max-w-[430px]">

//             <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

//             <input
//               type="text"
//               value={
//                 searchQuery
//               }
//               onChange={(
//                 event
//               ) =>
//                 setSearchQuery(
//                   event.target.value
//                 )
//               }
//               placeholder="Search starred files..."
//               className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-200"
//             />

//           </div>

//         </div>

//       </header>


//       <main className="mx-auto max-w-[1250px] px-6 py-8">


//         {error && (

//           <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

//             <span>

//               {String(
//                 error
//               )}

//             </span>

//             <button
//               type="button"
//               onClick={() =>
//                 setError(
//                   ""
//                 )
//               }
//             >

//               <FaTimes />

//             </button>

//           </div>

//         )}


//         {success && (

//           <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">

//             <span>

//               {String(
//                 success
//               )}

//             </span>

//             <button
//               type="button"
//               onClick={() =>
//                 setSuccess(
//                   ""
//                 )
//               }
//             >

//               <FaTimes />

//             </button>

//           </div>

//         )}


//         <div className="mb-6">

//           <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-yellow-600">

//             Favorites

//           </p>


//           <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">

//             <FaStar className="text-yellow-400" />

//             Starred Files

//           </h2>


//           <p className="mt-2 text-sm text-slate-500">

//             {filteredFiles.length}{" "}

//             {filteredFiles.length ===
//             1
//               ? "file"
//               : "files"}{" "}

//             in Starred

//           </p>

//         </div>


//         {filteredFiles.length ===
//         0 ? (

//           <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

//             <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-50">

//               <FaStar className="text-5xl text-yellow-300" />

//             </div>


//             <h3 className="text-xl font-bold text-slate-700">

//               {searchQuery
//                 ? "No matching files"
//                 : "No starred files"}

//             </h3>


//             <p className="mt-2 max-w-md text-sm text-slate-500">

//               {searchQuery
//                 ? "Try searching with a different file name."
//                 : "Mark important files with a star and they will appear here."}

//             </p>

//           </div>

//         ) : (

//           <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


//             <div className="grid grid-cols-[minmax(0,1fr)_120px_220px] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">

//               <div>
//                 Name
//               </div>

//               <div>
//                 Size
//               </div>

//               <div className="text-right">
//                 Actions
//               </div>

//             </div>


//             {filteredFiles.map(
//               (
//                 file
//               ) => (

//                 <div
//                   key={
//                     file.id
//                   }
//                   className="grid grid-cols-[minmax(0,1fr)_120px_220px] items-center border-b border-slate-100 px-6 py-4 last:border-b-0 transition hover:bg-slate-50"
//                 >


//                   <button
//                     type="button"
//                     onClick={() =>
//                       openPreview(
//                         file
//                       )
//                     }
//                     className="flex min-w-0 items-center gap-4 text-left"
//                   >

//                     <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">

//                       {getFileIcon(
//                         file
//                       )}

//                     </div>


//                     <div className="min-w-0">

//                       <p className="truncate font-semibold text-slate-700">

//                         {
//                           file.original_name
//                         }

//                       </p>


//                       <p className="mt-1 text-xs capitalize text-slate-400">

//                         {getFileCategory(
//                           file
//                         )}

//                       </p>

//                     </div>

//                   </button>


//                   <div className="text-sm text-slate-500">

//                     {formatBytes(
//                       file.size
//                     )}

//                   </div>


//                   <div className="flex items-center justify-end gap-2">


//                     <button
//                       type="button"
//                       onClick={() =>
//                         openPreview(
//                           file
//                         )
//                       }
//                       className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
//                     >

//                       Open

//                     </button>


//                     <button
//                       type="button"
//                       onClick={() =>
//                         handleDownload(
//                           file
//                         )
//                       }
//                       className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
//                     >

//                       <FaDownload />

//                     </button>


//                     <button
//                       type="button"
//                       onClick={() =>
//                         handleRemoveStar(
//                           file
//                         )
//                       }
//                       className="flex h-9 w-9 items-center justify-center rounded-lg text-yellow-500 transition hover:bg-yellow-50"
//                       title="Remove from Starred"
//                     >

//                       <FaStar />

//                     </button>

//                   </div>

//                 </div>

//               )
//             )}

//           </div>

//         )}

//       </main>


//       {selectedFile && (

//         <div className="fixed inset-0 z-[100] bg-black">


//           <div className="relative flex h-screen w-full flex-col overflow-hidden">


//             <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent px-4 py-5 sm:px-8">


//               <button
//                 type="button"
//                 onClick={
//                   closePreview
//                 }
//                 className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-xl transition hover:bg-white/25"
//               >

//                 <FaTimes />

//               </button>


//               <div className="absolute left-1/2 max-w-[60%] -translate-x-1/2 text-center">

//                 <p className="truncate text-sm font-semibold text-white sm:text-base">

//                   {
//                     selectedFile.original_name
//                   }

//                 </p>


//                 <p className="mt-1 text-xs text-white/60">

//                   {formatBytes(
//                     selectedFile.size
//                   )}

//                 </p>

//               </div>


//               <div className="flex items-center gap-2">


//                 {isImage(
//                   selectedFile
//                 ) && (

//                   <div className="flex items-center rounded-full bg-white/15 p-1 backdrop-blur-xl">


//                     <button
//                       type="button"
//                       onClick={() =>
//                         setImageZoom(
//                           (
//                             previous
//                           ) =>
//                             Math.max(
//                               0.5,
//                               previous -
//                               0.25
//                             )
//                         )
//                       }
//                       className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition hover:bg-white/20"
//                     >
//                       −
//                     </button>


//                     <button
//                       type="button"
//                       onClick={() =>
//                         setImageZoom(
//                           1
//                         )
//                       }
//                       className="min-w-[54px] px-2 text-xs font-semibold text-white"
//                     >

//                       {Math.round(
//                         imageZoom *
//                         100
//                       )}%

//                     </button>


//                     <button
//                       type="button"
//                       onClick={() =>
//                         setImageZoom(
//                           (
//                             previous
//                           ) =>
//                             Math.min(
//                               3,
//                               previous +
//                               0.25
//                             )
//                         )
//                       }
//                       className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition hover:bg-white/20"
//                     >
//                       +
//                     </button>

//                   </div>

//                 )}


//                 <button
//                   type="button"
//                   onClick={() =>
//                     handleDownload(
//                       selectedFile
//                     )
//                   }
//                   className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition hover:bg-white/25"
//                 >

//                   <FaDownload />

//                 </button>

//               </div>

//             </div>


//             <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black px-4 py-20 sm:px-10">


//               {previewItems.length >
//                 1 && (

//                 <button
//                   type="button"
//                   onClick={
//                     openPreviousPreview
//                   }
//                   className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-4xl text-white backdrop-blur-xl transition hover:bg-white/20 sm:left-8"
//                 >
//                   ‹
//                 </button>

//               )}


//               {previewLoading ? (

//                 <div className="flex flex-col items-center gap-4">

//                   <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />

//                   <p className="text-sm text-white">

//                     Loading preview...

//                   </p>

//                 </div>

//               ) : previewError ? (

//                 <div className="rounded-2xl bg-red-500/20 px-8 py-6 text-center text-red-200">

//                   {String(
//                     previewError
//                   )}

//                 </div>

//               ) : previewUrl ? (

//                 isImage(
//                   selectedFile
//                 ) ? (

//                   <div className="flex h-full w-full items-center justify-center overflow-auto">

//                     <img
//                       src={
//                         previewUrl
//                       }
//                       alt={
//                         selectedFile.original_name
//                       }
//                       style={{
//                         transform:
//                           `scale(${imageZoom})`,
//                       }}
//                       className="max-h-[80vh] max-w-full rounded-xl object-contain transition-transform duration-200"
//                     />

//                   </div>

//                 ) : isVideo(
//                   selectedFile
//                 ) ? (

//                   <video
//                     src={
//                       previewUrl
//                     }
//                     controls
//                     autoPlay
//                     className="max-h-[80vh] max-w-full rounded-xl"
//                   />

//                 ) : null

//               ) : null}


//               {previewItems.length >
//                 1 && (

//                 <button
//                   type="button"
//                   onClick={
//                     openNextPreview
//                   }
//                   className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-4xl text-white backdrop-blur-xl transition hover:bg-white/20 sm:right-8"
//                 >
//                   ›
//                 </button>

//               )}

//             </div>


//             <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center bg-gradient-to-t from-black/90 to-transparent px-6 py-6">

//               <div className="rounded-full bg-white/10 px-5 py-2 text-xs text-white/80 backdrop-blur-xl">

//                 {currentPreviewIndex >=
//                 0
//                   ? `${currentPreviewIndex + 1} of ${previewItems.length}`
//                   : ""}

//               </div>

//             </div>

//           </div>

//         </div>

//       )}

//     </div>

//   );

// }


// export default Starred;
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/v1";


const api = axios.create({
    baseURL: API_BASE_URL,
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(
            "access_token"
        );

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        if (
            config.data instanceof FormData
        ) {
            delete config.headers[
                "Content-Type"
            ];
        } else if (
            !config.headers[
                "Content-Type"
            ]
        ) {
            config.headers[
                "Content-Type"
            ] = "application/json";
        }

        return config;
    },
    (error) => Promise.reject(error)
);


/* =========================
   PUBLIC SHARE URL
========================= */

export const getPublicShareUrl = (
    shareToken
) => {
    if (!shareToken) {
        return "";
    }

    const apiBaseUrl =
        API_BASE_URL.replace(
            /\/$/,
            ""
        );

    return `${apiBaseUrl}/shares/public/${shareToken}`;
};


/* =========================
   FILE TRASH API
========================= */

export const getTrashFiles =
    async () => {
        const response = await api.get(
            "/files/trash/"
        );

        return response.data;
    };


export const restoreTrashFile =
    async (fileId) => {
        const response = await api.put(
            `/files/${fileId}/restore`
        );

        return response.data;
    };


export const permanentlyDeleteTrashFile =
    async (fileId) => {
        const response = await api.delete(
            `/files/${fileId}/permanent`
        );

        return response.data;
    };


export const emptyTrash =
    async (files) => {
        await Promise.all(
            files.map(
                (file) =>
                    api.delete(
                        `/files/${file.id}/permanent`
                    )
            )
        );
    };


/* =========================
   FOLDER TRASH API
========================= */

export const getTrashFolders =
    async () => {
        const response = await api.get(
            "/folders/trash/"
        );

        return response.data;
    };


export const getTrashFolderFiles =
    async (folderId) => {
        const response = await api.get(
            `/folders/${folderId}/trash-files`
        );

        return response.data;
    };


export const restoreTrashFolder =
    async (folderId) => {
        const response = await api.put(
            `/folders/${folderId}/restore`
        );

        return response.data;
    };


export const permanentlyDeleteTrashFolder =
    async (folderId) => {
        const response = await api.delete(
            `/folders/${folderId}/permanent`
        );

        return response.data;
    };


export const emptyTrashFolders =
    async (folders) => {
        await Promise.all(
            folders.map(
                (folder) =>
                    api.delete(
                        `/folders/${folder.id}/permanent`
                    )
            )
        );
    };


export default api;
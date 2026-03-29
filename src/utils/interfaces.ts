export type FileRec = {
    name: string;
    device: string;
    path: string;
    status: string;
    //a uniqueId per file derived by device + path
    id?: string;
};

/*
    A common interface expected as a response from the backend.
*/
export type ApiResponse = {
    data?: any;
    ok: boolean;
    error?: string;
};

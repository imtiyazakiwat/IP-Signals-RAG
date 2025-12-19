declare const router: import("express-serve-static-core").Router;
export interface UploadResponse {
    status: 'flagged' | 'safe';
    matches: Array<{
        filename: string;
        similarity: string;
    }>;
    processingTime: number;
}
export default router;
//# sourceMappingURL=upload.d.ts.map
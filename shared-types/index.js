"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaType = exports.ApprovalStatus = exports.WorkflowStage = exports.ProjectStatus = void 0;
exports.ProjectStatus = {
    DRAFT: 'DRAFT',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};
exports.WorkflowStage = {
    SCRIPT_GENERATION: 'SCRIPT_GENERATION',
    IMAGE_GENERATION: 'IMAGE_GENERATION',
    VIDEO_GENERATION: 'VIDEO_GENERATION',
    AUDIO_GENERATION: 'AUDIO_GENERATION',
    FINAL_ASSEMBLY: 'FINAL_ASSEMBLY',
    COMPLETED: 'COMPLETED',
};
exports.ApprovalStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    REGENERATING: 'REGENERATING',
};
exports.MediaType = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
};
//# sourceMappingURL=index.js.map
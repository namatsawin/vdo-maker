export declare const ProjectStatus: {
    readonly DRAFT: "DRAFT";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
};
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export declare const WorkflowStage: {
    readonly SCRIPT_GENERATION: "SCRIPT_GENERATION";
    readonly IMAGE_GENERATION: "IMAGE_GENERATION";
    readonly VIDEO_GENERATION: "VIDEO_GENERATION";
    readonly AUDIO_GENERATION: "AUDIO_GENERATION";
    readonly FINAL_ASSEMBLY: "FINAL_ASSEMBLY";
    readonly COMPLETED: "COMPLETED";
};
export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage];
export declare const ApprovalStatus: {
    readonly DRAFT: "DRAFT";
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly REGENERATING: "REGENERATING";
};
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
export declare const MediaType: {
    readonly IMAGE: "IMAGE";
    readonly VIDEO: "VIDEO";
    readonly AUDIO: "AUDIO";
};
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
export interface MediaAsset {
    id: string;
    url: string;
    prompt?: string;
    status: ApprovalStatus;
    metadata?: Record<string, any>;
    duration?: number;
    createdAt: string;
    updatedAt: string;
}
export interface VideoSegment {
    id: string;
    order: number;
    script: string;
    videoPrompt: string;
    status: ApprovalStatus;
    images: MediaAsset[];
    videos: MediaAsset[];
    audios: MediaAsset[];
    scriptApprovalStatus: ApprovalStatus;
    imageApprovalStatus: ApprovalStatus;
    videoApprovalStatus: ApprovalStatus;
    audioApprovalStatus: ApprovalStatus;
    finalApprovalStatus: ApprovalStatus;
    createdAt: string;
    updatedAt: string;
}
export interface Project {
    id: string;
    title: string;
    description?: string;
    status: ProjectStatus;
    currentStage: WorkflowStage;
    segments: VideoSegment[];
    createdAt: string;
    updatedAt: string;
    userId: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface CreateProjectRequest {
    title: string;
    description?: string;
    story?: string;
}
export interface UpdateProjectRequest {
    title?: string;
    description?: string;
    status?: ProjectStatus;
    currentStage?: WorkflowStage;
}
export interface UpdateSegmentRequest {
    script?: string;
    videoPrompt?: string;
    scriptApprovalStatus?: ApprovalStatus;
    imageApprovalStatus?: ApprovalStatus;
    videoApprovalStatus?: ApprovalStatus;
    audioApprovalStatus?: ApprovalStatus;
    finalApprovalStatus?: ApprovalStatus;
}
export interface ScriptGenerationRequest {
    title: string;
    description?: string;
}
export interface ScriptSegment {
    order: number;
    script: string;
    videoPrompt: string;
}
export interface ImageGenerationRequest {
    prompt: string;
    segmentId: string;
}
export interface VideoGenerationRequest {
    imageUrl: string;
    prompt: string;
    segmentId: string;
}
export interface AudioGenerationRequest {
    text: string;
    voice: string;
    segmentId: string;
}
export interface JobData {
    type: 'SCRIPT_GENERATION' | 'IMAGE_GENERATION' | 'VIDEO_GENERATION' | 'AUDIO_GENERATION' | 'VIDEO_ASSEMBLY';
    projectId?: string;
    segmentId?: string;
    prompt?: string;
    text?: string;
    voice?: string;
    [key: string]: any;
}
export interface Segment extends VideoSegment {
    image?: MediaAsset;
    video?: MediaAsset;
    audio?: MediaAsset;
    finalVideo?: MediaAsset;
    approvalStatus: {
        script: ApprovalStatus;
        image: ApprovalStatus;
        video: ApprovalStatus;
        audio: ApprovalStatus;
        final: ApprovalStatus;
    };
    duration?: number;
}
//# sourceMappingURL=index.d.ts.map
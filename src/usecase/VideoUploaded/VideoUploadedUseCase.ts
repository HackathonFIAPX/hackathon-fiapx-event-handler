import { AdminServiceAdapter, EVideoStatus, IAdminServiceAdapter } from "../../infra/adapters/AdminServiceAdapter";
import { Logger } from "../../infra/utils/logger";
import { IVideoUploadedUseCase } from "./IVideoUploadedUseCase";
import { TVideoUploadedUseCaseInput, TVideoUploadedUseCaseOutput } from "./TVideoUploadedUseCase";

export class VideoUploadedUseCase implements IVideoUploadedUseCase {
    constructor(
        private readonly adminServiceAdapter: IAdminServiceAdapter = new AdminServiceAdapter()
    ) {}

    async execute({
        bucket,
        key
    }: TVideoUploadedUseCaseInput): Promise<TVideoUploadedUseCaseOutput> {
        Logger.info("VideoUploaded", "Processing video events", { bucket, key });
        
        const decodedKey = decodeURIComponent(key.replace(/\+/g, " "));
        Logger.info("VideoUploaded", "Decoded S3 key", { decodedKey });

        const pathParts = decodedKey.split("/");
        const videoName = pathParts[pathParts.length - 1];
        const clientId = pathParts[pathParts.length - 2];
        const videoId = videoName.split(".")[0];
        
        const input = {
            clientId,
            videoId,
            status: EVideoStatus.UPLOADED
        };
        Logger.info("VideoUploaded", "Updating video status in admin service", input);

        await this.adminServiceAdapter.updateUserVideoStatus(input);
    }
}
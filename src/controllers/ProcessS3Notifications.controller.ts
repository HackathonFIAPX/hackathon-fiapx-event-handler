import { IVideoUploadedUseCase } from "../usecase/VideoUploaded/IVideoUploadedUseCase";
import { VideoUploadedUseCase } from "../usecase/VideoUploaded/VideoUploadedUseCase";
import { IController } from "./controller";
import { HandlerResponse } from "./router";

type TProcessS3NotificationsController = {
    Message: string;
}

export class ProcessS3NotificationsController implements IController<TProcessS3NotificationsController> {
    constructor(
        private readonly videoUploadedUseCase: IVideoUploadedUseCase = new VideoUploadedUseCase()
    ) {}

    async execute(request: TProcessS3NotificationsController): Promise<HandlerResponse> {
        const body = JSON.parse(request.Message);
        await this.videoUploadedUseCase.execute({
            bucket: body.Records[0].s3.bucket.name,
            key: body.Records[0].s3.object.key,
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "S3 notification processed successfully",
            }),
        };
    }
}
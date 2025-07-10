import { EVideoStatus } from "../infra/adapters/AdminServiceAdapter";
import { IUpdateVideoStatusUseCase } from "../usecase/UpdateVideoStatus/IUpdateVideoStatusUseCase";
import { UpdateVideoStatusUseCase } from "../usecase/UpdateVideoStatus/UpdateVideoStatusUseCase";
import { IController } from "./controller";
import { HandlerResponse } from "./router";

type TUpdateVideoStatusController = {
    clientId: string;
    videoId: string;
    status: EVideoStatus;
}

export class UpdateVideoStatusController implements IController<TUpdateVideoStatusController> {
    constructor(
        private readonly updateVideoStatusUseCase: IUpdateVideoStatusUseCase = new UpdateVideoStatusUseCase()
    ) {}

    async execute(request: TUpdateVideoStatusController): Promise<HandlerResponse> {
        const { clientId, videoId, status } = request;
        await this.updateVideoStatusUseCase.execute({ clientId, videoId, status });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Status updated successfully",
            }),
        };
    }
}
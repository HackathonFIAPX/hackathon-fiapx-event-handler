import { AdminServiceAdapter, IAdminServiceAdapter } from "../../infra/adapters/AdminServiceAdapter";
import { IUpdateVideoStatusUseCase } from "./IUpdateVideoStatusUseCase";
import { TUpdateVideoStatusUseCaseInput, TUpdateVideoStatusUseCaseOutput } from "./TUpdateVideoStatusUseCase";

export class UpdateVideoStatusUseCase implements IUpdateVideoStatusUseCase {
    constructor(
        private readonly adminServiceAdapter: IAdminServiceAdapter = new AdminServiceAdapter()
    ) {}

    async execute(input: TUpdateVideoStatusUseCaseInput): Promise<TUpdateVideoStatusUseCaseOutput> {
        const { clientId, videoId, status } = input;
        await this.adminServiceAdapter.updateUserVideoStatus({clientId, videoId, status});
    }
}
import { EVideoStatus } from "../../infra/adapters/AdminServiceAdapter";

export type TUpdateVideoStatusUseCaseInput = {
    clientId: string;
    videoId: string;
    status: EVideoStatus;
};

export type TUpdateVideoStatusUseCaseOutput = void;
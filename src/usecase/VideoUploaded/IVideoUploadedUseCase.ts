import { IUseCase } from "../usecase";
import { TVideoUploadedUseCaseInput, TVideoUploadedUseCaseOutput } from "./TVideoUploadedUseCase";

export interface IVideoUploadedUseCase extends IUseCase<TVideoUploadedUseCaseInput, TVideoUploadedUseCaseOutput> {}
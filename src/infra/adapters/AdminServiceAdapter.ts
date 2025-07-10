import axios from "axios";
import { envEndpoints } from "../../config/endpoints";

export enum EVideoStatus {
    UPLOAD_PENDING = 'UPLOAD_PENDING',
    UPLOADED = 'UPLOADED',
    CONVERTING_TO_FPS = 'CONVERTING_TO_FPS',
    FINISHED = 'FINISHED',
}

export interface IUpdateUserVideoStatusInput {
    clientId: string;
    videoId: string;
    status: string;
}

export interface IAdminServiceAdapter {
    updateUserVideoStatus(input: IUpdateUserVideoStatusInput): Promise<void>    
}

export class AdminServiceAdapter implements IAdminServiceAdapter {
    private readonly adminRequester

    constructor() {
        this.adminRequester = axios.create({
            baseURL: envEndpoints.adminService,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async updateUserVideoStatus(input: IUpdateUserVideoStatusInput): Promise<void> {
        const result = await this.adminRequester.put('/v1/private/videos', input)

        if (result.status !== 200) {
            throw new Error(`Error creating item queue: ${result.statusText}`);
        }
    }
}
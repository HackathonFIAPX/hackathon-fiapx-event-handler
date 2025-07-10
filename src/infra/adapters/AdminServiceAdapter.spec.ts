import axios from 'axios';
import { AdminServiceAdapter, EVideoStatus, IUpdateUserVideoStatusInput } from './AdminServiceAdapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../config/endpoints', () => ({
    envEndpoints: {
        adminService: 'http://mock-admin-service.com',
    },
}));

describe('AdminServiceAdapter', () => {
    let adapter: AdminServiceAdapter;
    const mockPut = jest.fn();

    beforeEach(() => {
        mockedAxios.create.mockReturnValue({
            put: mockPut,
        } as any);
        adapter = new AdminServiceAdapter();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(adapter).toBeDefined();
    });

    describe('updateUserVideoStatus', () => {
        it('should call the admin service to update video status successfully', async () => {
            const input: IUpdateUserVideoStatusInput = {
                clientId: 'client-1',
                videoId: 'video-1',
                status: EVideoStatus.UPLOADED,
            };

            mockPut.mockResolvedValue({ status: 200, data: {} });

            await adapter.updateUserVideoStatus(input);

            expect(mockedAxios.create).toHaveBeenCalledWith({
                baseURL: 'http://mock-admin-service.com/admin-api',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            expect(mockPut).toHaveBeenCalledWith('/v1/private/videos', input);
        });

        it('should throw an error if the admin service returns a non-200 status', async () => {
            const input: IUpdateUserVideoStatusInput = {
                clientId: 'client-1',
                videoId: 'video-1',
                status: EVideoStatus.UPLOADED,
            };

            mockPut.mockResolvedValue({ status: 500, statusText: 'Internal Server Error' });

            await expect(adapter.updateUserVideoStatus(input)).rejects.toThrow(
                'Error creating item queue: Internal Server Error'
            );
        });
    });
});
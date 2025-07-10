import { VideoUploadedUseCase } from '../../usecase/VideoUploaded/VideoUploadedUseCase';
import { AdminServiceAdapter, EVideoStatus } from '../../infra/adapters/AdminServiceAdapter';
import { Logger } from '../../infra/utils/logger';

jest.mock('../../infra/adapters/AdminServiceAdapter');
jest.mock('../../infra/utils/logger');

describe('VideoUploadedUseCase', () => {
    let videoUploadedUseCase: VideoUploadedUseCase;
    let mockAdminServiceAdapter: jest.Mocked<AdminServiceAdapter>;

    beforeEach(() => {
        mockAdminServiceAdapter = new AdminServiceAdapter() as jest.Mocked<AdminServiceAdapter>;
        videoUploadedUseCase = new VideoUploadedUseCase(mockAdminServiceAdapter);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(videoUploadedUseCase).toBeDefined();
    });

    it('should process video upload event and update user video status', async () => {
        const input = {
            bucket: 'test-bucket',
            key: 'path/to/client-id/video-name.mp4',
        };

        mockAdminServiceAdapter.updateUserVideoStatus.mockResolvedValue(undefined);

        await videoUploadedUseCase.execute(input);

        expect(Logger.info).toHaveBeenCalledWith(
            'VideoUploaded',
            'Processing video events',
            { bucket: 'test-bucket', key: 'path/to/client-id/video-name.mp4' }
        );
        expect(Logger.info).toHaveBeenCalledWith(
            'VideoUploaded',
            'Decoded S3 key',
            { decodedKey: 'path/to/client-id/video-name.mp4' }
        );
        expect(mockAdminServiceAdapter.updateUserVideoStatus).toHaveBeenCalledWith({
            clientId: 'client-id',
            videoId: 'video-name',
            status: EVideoStatus.UPLOADED,
        });
        expect(Logger.info).toHaveBeenCalledWith(
            'VideoUploaded',
            'Updating video status in admin service',
            {
                clientId: 'client-id',
                videoId: 'video-name',
                status: EVideoStatus.UPLOADED,
            }
        );
    });

    it('should handle keys with plus signs correctly', async () => {
        const input = {
            bucket: 'test-bucket',
            key: 'path/to/client-id/video+name.mp4',
        };

        mockAdminServiceAdapter.updateUserVideoStatus.mockResolvedValue(undefined);

        await videoUploadedUseCase.execute(input);

        expect(Logger.info).toHaveBeenCalledWith(
            'VideoUploaded',
            'Decoded S3 key',
            { decodedKey: 'path/to/client-id/video name.mp4' }
        );
        expect(mockAdminServiceAdapter.updateUserVideoStatus).toHaveBeenCalledWith({
            clientId: 'client-id',
            videoId: 'video name',
            status: EVideoStatus.UPLOADED,
        });
    });

    it('when request withtout constructor parameters, should work right', async () => {
        const videoUploadedUseCaseWithoutParams = new VideoUploadedUseCase();
        expect(videoUploadedUseCaseWithoutParams).toBeInstanceOf(VideoUploadedUseCase);
    })
});
import { UpdateVideoStatusUseCase } from './UpdateVideoStatusUseCase';
import { AdminServiceAdapter, EVideoStatus } from '../../infra/adapters/AdminServiceAdapter';

jest.mock('../../infra/adapters/AdminServiceAdapter');

describe('UpdateVideoStatusUseCase', () => {
    let updateVideoStatusUseCase: UpdateVideoStatusUseCase;
    let mockAdminServiceAdapter: jest.Mocked<AdminServiceAdapter>;

    beforeEach(() => {
        mockAdminServiceAdapter = new AdminServiceAdapter() as jest.Mocked<AdminServiceAdapter>;
        updateVideoStatusUseCase = new UpdateVideoStatusUseCase(mockAdminServiceAdapter);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(updateVideoStatusUseCase).toBeDefined();
    });

    it('should call adminServiceAdapter.updateUserVideoStatus with correct input', async () => {
        const input = {
            clientId: 'test-client-id',
            videoId: 'test-video-id',
            status: EVideoStatus.UPLOADED,
        };

        mockAdminServiceAdapter.updateUserVideoStatus.mockResolvedValue(undefined);

        await updateVideoStatusUseCase.execute(input);

        expect(mockAdminServiceAdapter.updateUserVideoStatus).toHaveBeenCalledWith(input);
    });

    it('when request withtout constructor parameters, should work right', async () => {
        const videoUpdateVideoStatusUseCaseWithoutParams = new UpdateVideoStatusUseCase();
        expect(videoUpdateVideoStatusUseCaseWithoutParams).toBeInstanceOf(UpdateVideoStatusUseCase);
    })
});
import { UpdateVideoStatusController } from './UpdateVideoStatus.controller';
import { UpdateVideoStatusUseCase } from '../usecase/UpdateVideoStatus/UpdateVideoStatusUseCase';
import { EVideoStatus } from '../infra/adapters/AdminServiceAdapter';

jest.mock('../usecase/UpdateVideoStatus/UpdateVideoStatusUseCase');

describe('UpdateVideoStatusController', () => {
    let controller: UpdateVideoStatusController;
    let mockUpdateVideoStatusUseCase: jest.Mocked<UpdateVideoStatusUseCase>;

    beforeEach(() => {
        mockUpdateVideoStatusUseCase = new UpdateVideoStatusUseCase() as jest.Mocked<UpdateVideoStatusUseCase>;
        controller = new UpdateVideoStatusController(mockUpdateVideoStatusUseCase);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call updateVideoStatusUseCase.execute and return a success response', async () => {
        const request = {
            clientId: 'test-client',
            videoId: 'test-video',
            status: EVideoStatus.UPLOADED,
        };

        mockUpdateVideoStatusUseCase.execute.mockResolvedValue(undefined);

        const response = await controller.execute(request);

        expect(mockUpdateVideoStatusUseCase.execute).toHaveBeenCalledWith(request);
        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({
                message: "Status updated successfully",
            }),
        });
    });

    it('when request withtout constructor parameters, should work right', async () => {
        const videoUpdateVideoStatusControllerWithoutParams = new UpdateVideoStatusController();
        expect(videoUpdateVideoStatusControllerWithoutParams).toBeInstanceOf(UpdateVideoStatusController);
    })
});
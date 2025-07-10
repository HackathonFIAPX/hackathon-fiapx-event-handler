import { Context, SQSEvent } from 'aws-lambda';
import { ProcessS3NotificationsController } from './controllers/ProcessS3Notifications.controller';
import { Router } from './controllers/router';
import { Logger } from './infra/utils/logger';
import { EEventHandlerRoutes, EventHandler } from './event.handler';

jest.mock('./controllers/router');
jest.mock('./infra/utils/logger');
jest.mock('./controllers/ProcessS3Notifications.controller');

describe('EventHandler', () => {
    let mockRouter: jest.Mocked<Router>;
    let mockProcessS3NotificationsController: jest.Mocked<ProcessS3NotificationsController>;

    beforeEach(() => {
        mockRouter = new Router() as jest.Mocked<Router>;
        mockProcessS3NotificationsController = new ProcessS3NotificationsController() as jest.Mocked<ProcessS3NotificationsController>;

        (Router as jest.Mock).mockImplementation(() => mockRouter);
        (ProcessS3NotificationsController as jest.Mock).mockImplementation(() => mockProcessS3NotificationsController);

        jest.clearAllMocks();
    });

    it('should handle NOTIFICATION event type and return response', async () => {
        const mockEvent: SQSEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        Type: EEventHandlerRoutes.NOTIFICATION,
                        data: { some: 'data' },
                    }),
                } as any,
            ],
        };
        const mockContext: Context = {} as any;
        const expectedResponse = { statusCode: 200, body: {} };

        mockRouter.execute.mockResolvedValue(expectedResponse);

        const response = await EventHandler.handler(mockEvent, mockContext);

        expect(mockRouter.use).toHaveBeenCalledWith(
            EEventHandlerRoutes.NOTIFICATION,
            expect.any(Function)
        );
        expect(mockRouter.use).toHaveBeenCalledWith(
            EEventHandlerRoutes.UPDATE_USER_VIDEO_STATUS,
            expect.any(Function)
        );
        expect(mockRouter.execute).toHaveBeenCalledWith(
            EEventHandlerRoutes.NOTIFICATION,
            JSON.parse(mockEvent.Records[0].body)
        );
        expect(response).toEqual(expectedResponse);
    });

    it('should handle other event types and return response', async () => {
        const mockEvent: SQSEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        type: EEventHandlerRoutes.UPDATE_USER_VIDEO_STATUS,
                        data: { videoId: '123' },
                    }),
                } as any,
            ],
        };
        const mockContext: Context = {} as any;
        const expectedResponse = { statusCode: 200, body: {} };

        mockRouter.execute.mockResolvedValue(expectedResponse);

        const response = await EventHandler.handler(mockEvent, mockContext);

        expect(mockRouter.use).toHaveBeenCalledWith(
            EEventHandlerRoutes.NOTIFICATION,
            expect.any(Function)
        );
        expect(mockRouter.use).toHaveBeenCalledWith(
            EEventHandlerRoutes.UPDATE_USER_VIDEO_STATUS,
            expect.any(Function)
        );
        expect(mockRouter.execute).toHaveBeenCalledWith(
            EEventHandlerRoutes.UPDATE_USER_VIDEO_STATUS,
            { videoId: '123' }
        );
        expect(response).toEqual(expectedResponse);
    });

    it('should catch and log errors', async () => {
        const mockEvent: SQSEvent = {
            Records: [
                {
                    body: 'invalid json',
                } as any,
            ],
        };
        const mockContext: Context = {} as any;
        const expectedError = new Error('Unexpected token i in JSON at position 0');

        await expect(EventHandler.handler(mockEvent, mockContext)).rejects.toThrow(
            `Error processing video: Unexpected token`
        );

        expect(Logger.error).toHaveBeenCalledWith(
            'EventHandler.handler',
            'error',
            expect.any(Error)
        );
    });
});
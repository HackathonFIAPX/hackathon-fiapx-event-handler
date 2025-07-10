import { Context, SQSEvent } from "aws-lambda";
import { Router } from "./controllers/router";
import { Logger } from "./infra/utils/logger";
import { ProcessS3NotificationsController } from "./controllers/ProcessS3Notifications.controller";

export enum EEventHandlerRoutes {
    NOTIFICATION = 'Notification',
    UPDATE_USER_VIDEO_STATUS = 'event.handler.updateUserVideoStatus',
}

export class EventHandler {
    static async handler(event: SQSEvent, _: Context) {
        try {
            Logger.info('EventHandler.handler', 'start', event);
            
            const record = event.Records[0];
            const body = JSON.parse(record.body);
            const { Type, type, data } = body;

            const processS3NotificationsController = new ProcessS3NotificationsController();

            const router = new Router();
            router.use(EEventHandlerRoutes.NOTIFICATION,processS3NotificationsController.execute.bind(processS3NotificationsController));
            router.use(EEventHandlerRoutes.UPDATE_USER_VIDEO_STATUS, (body: any): Promise<any> => { return {} as any });
            
            let response;
            if (EEventHandlerRoutes.NOTIFICATION == Type) {
                response = await router.execute(Type, body);
            } else {
                response = await router.execute(type, data);
            }

            Logger.info('EventHandler.handler', 'end', response);

            return response;
        } catch (error: any) {
            Logger.error('EventHandler.handler', 'error', error);
            throw new Error(`Error processing video: ${error?.message}`);
        }
    }
}
import { AdminServiceAdapter, EVideoStatus } from "./infra/adapters/AdminServiceAdapter";
import { Logger } from "./infra/utils/logger";

export const handler = async (event: any) => {
    for (const record of event.Records) {
      if (record.eventName === "MODIFY") {
        const newItem = record.dynamodb.NewImage;
        const count = parseInt(newItem.count.N);
        const total = parseInt(newItem.total.N);
        
        Logger.info("DynamoEventTracker", `Processing record with ID: ${newItem.id.S}, Count: ${count}, Total: ${total}`);

        const eventData = {
            id: newItem.id.S,
            clientId: newItem.clientId.S,
            videoId: newItem.videoId.S,
            total,
            count
        };
        Logger.info("DynamoEventTracker", "Event data extracted", eventData);

        const adminAdapter = new AdminServiceAdapter();

        if(count === 1 && total > 1) {
          Logger.info("DynamoEventTracker", "Updating video status to CONVERTING_TO_FPS", eventData);
          await adminAdapter.updateUserVideoStatus({
            clientId: eventData.clientId,
            videoId: eventData.videoId,
            status: EVideoStatus.CONVERTING_TO_FPS
          });
        } else if (count === total) {
          Logger.info("DynamoEventTracker", "Updating video status to FINISHED", eventData);
          await adminAdapter.updateUserVideoStatus({
            clientId: eventData.clientId,
            videoId: eventData.videoId,
            status: EVideoStatus.FINISHED
          }) 
        }
      }
    }
  };
  
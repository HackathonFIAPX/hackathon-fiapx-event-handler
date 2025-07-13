import { ListObjectsV2Command, _Object, S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { AdminServiceAdapter, EVideoStatus } from "./infra/adapters/AdminServiceAdapter";
import { Logger } from "./infra/utils/logger";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import archiver from "archiver";
import { Readable } from "stream";
import { envAWS } from "./config/aws";
import axios from "axios";
import path from "path";

export const handler = async (event: any) => {
  const bucketName = `fiapx-video-fps-bucket`;

  async function updateVideoStatus(clientId: string, videoId: string, status: EVideoStatus) {
    const adminAdapter = new AdminServiceAdapter();
    return await adminAdapter.updateUserVideoStatus({
      clientId,
      videoId,
      status
    });
  }

  async function getListOfFilesInBucket(clientId: string, videoId: string): Promise<_Object[]> {
    const s3 = new S3Client({ region: "us-west-2" });

    const prefix = `${clientId}/${videoId}`;

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3.send(listCommand);
    return response.Contents || [];
  }

  async function getPresignedUrlFromBucketContent(bucketObject: _Object): Promise<string> {
    const s3 = new S3Client({
      region: envAWS.region,
      credentials: {
          accessKeyId: envAWS.accessKeyId,
          secretAccessKey: envAWS.secretAccessKey,
          sessionToken: envAWS.sessionToken,
      }
  });

    const objectKey = bucketObject.Key!;

    Logger.info("DynamoEventTracker", `Generating presigned URL for object: ${objectKey}`);
    const presignCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const url = await getSignedUrl(s3, presignCommand, { expiresIn: 3600 });
    Logger.info("DynamoEventTracker", `Presigned URL command created for object: ${objectKey}`, { url });
    return url;
  }

  async function uploadToS3(fileName: string, bucketName: string, clientId: string, videoId: string) {
    Logger.info("DynamoEventTracker", `Uploading file to S3: ${fileName}`, { bucketName, clientId, videoId });
    const s3 = new S3Client({
      region: envAWS.region,
      credentials: {
          accessKeyId: envAWS.accessKeyId,
          secretAccessKey: envAWS.secretAccessKey,
          sessionToken: envAWS.sessionToken,
      }
    });

    const files = fs.readdirSync("/tmp");

    Logger.info("DynamoEventTracker", `Files in /tmp directory:`, { files });
    files.forEach(file => {
      const filePath = path.join("tmp", file);
      const stats = fs.statSync(filePath);
      const fileInfo = {
          name: file,
          size: stats.size,
          isDir: stats.isDirectory(),
      };
      Logger.info("DynamoEventTracker", `File info:`, { fileInfo, event });
    });

    const fileStream = fs.createReadStream("/tmp/final_result.zip");

    const fileKey = `${clientId}/${videoId}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileStream,
      ContentType: "application/zip",
    });

    Logger.info("DynamoEventTracker", `Preparing to upload file: ${fileName}`, { bucketName, fileKey });
    await s3.send(command);
    Logger.info("DynamoEventTracker", `File uploaded to S3: ${fileName}`, { bucketName, clientId, videoId });
  }

  async function mergeZip(clientId: string, videoId: string) {
    Logger.info("DynamoEventTracker", `Merging files for clientId: ${clientId}, videoId: ${videoId}`);
    const files = await getListOfFilesInBucket(clientId, videoId);
    if (files.length === 0) {
      Logger.error("DynamoEventTracker", `No files found for clientId: ${clientId}, videoId: ${videoId}`);
      return;
    }

    Logger.info("DynamoEventTracker", `Found ${files.length} files for clientId: ${clientId}, videoId: ${videoId}`, { files });
    const presignedUrls = await Promise.all(files.map(getPresignedUrlFromBucketContent));
    
    Logger.info("DynamoEventTracker", `Merging files for clientId: ${clientId}, videoId: ${videoId}`, { presignedUrls });
    const filename = "final_result.zip";
    const outputPath = `/tmp/${filename}`;
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    
    archive.pipe(output);

    let idx = 0;
    for (const url of presignedUrls) {
      const fileName = `zip_${idx}.mp4`;
      Logger.info("DynamoEventTracker", `Adding file to archive: ${fileName}`, { url });

      try {
        const response = await axios.get<Readable>(url, { responseType: "stream" });
        
        Logger.info("DynamoEventTracker", `File fetched from URL: ${url}`, { fileName });

        try {
          archive.append(response.data, { name: fileName });
          Logger.info("DynamoEventTracker", `File added to archive: ${fileName}`, { idx });
        } catch (archiveError) {
          Logger.error("DynamoEventTracker", `Error adding file to archive: ${fileName}`, { error: archiveError, idx });
          throw archiveError;
        }
      } catch (error) {
        Logger.error("DynamoEventTracker", `Error from axios: ${url}`, { error, fileName });
        throw error;
      }
      idx++;
    }

    await archive.finalize();
    Logger.info("DynamoEventTracker", `Files merged successfully for clientId: ${clientId}, videoId: ${videoId}`, { outputPath });
    
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
          Logger.info("DynamoEventTracker", `Stream de saída fechado para: ${outputPath}`);
          resolve();
      });
      output.on('error', (err) => {
          Logger.error("DynamoEventTracker", `Erro no stream de saída para: ${outputPath}`, { error: err });
          reject(err);
      });
    });

    await uploadToS3(filename, bucketName, clientId, videoId);
    Logger.info("DynamoEventTracker", `Upload completed for clientId: ${clientId}, videoId: ${videoId}`);
  }

  for (const record of event.Records) {
    if (record.eventName === "MODIFY") {
      const newItem = record.dynamodb.NewImage;
      const count = parseInt(newItem.count.N);
      const total = parseInt(newItem.total.N);
      
      Logger.info("DynamoEventTracker", `Processing record with ID: ${newItem.id.S}, Count: ${count}, Total: ${total}`);

      const eventData = {
          id: newItem.id.S,
          videoId: newItem.videoId.S,
          total,
          count
      };
      Logger.info("DynamoEventTracker", "Event data extracted", eventData);

      try {
        if(count === 1 && total > 1) {
          Logger.info("DynamoEventTracker", "Updating video status to CONVERTING_TO_FPS", eventData);
          await updateVideoStatus(eventData.id, eventData.videoId, EVideoStatus.CONVERTING_TO_FPS);
        } else if (count === 1 && total === 1) {
          Logger.info("DynamoEventTracker", "Updating video status to CONVERTED_TO_FPS", eventData);
          await updateVideoStatus(eventData.id, eventData.videoId, EVideoStatus.CONVERTING_TO_FPS);
          Logger.info("DynamoEventTracker", "Merging zip for single file", eventData);
          await mergeZip(eventData.id, eventData.videoId);
          Logger.info("DynamoEventTracker", "Updating video status to FINISHED", eventData);
          await updateVideoStatus(eventData.id, eventData.videoId, EVideoStatus.FINISHED);
        } else if (count === total) {
          Logger.info("DynamoEventTracker", "All files processed, merging zip", eventData);
          await mergeZip(eventData.id, eventData.videoId);
          Logger.info("DynamoEventTracker", "Updating video status to FINISHED", eventData);
          await updateVideoStatus(eventData.id, eventData.videoId, EVideoStatus.FINISHED);
        }
      } catch (error) {
        Logger.error("DynamoEventTracker", "Error processing record", { error, eventData });
      }
    }
  }
};
  
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 } 
  })
    .onUploadComplete(async ({ file }) => {
      console.log(`[UPLOADTHING] File successfully uploaded to edge cloud:`, file.url);
      return { uploadedBy: "TenantSystem", url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// These generate the buttons linked to your specific router type
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
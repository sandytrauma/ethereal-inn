// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Core FileRouter implementation block for your application
export const ourFileRouter = {
  // End-point profile configuration allowing images up to 4MB
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UPLOADTHING] File successfully uploaded to edge cloud:`, file.url);
      return { uploadedBy: "TenantSystem", url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Exporting React frontend UI drop-in utility buttons
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
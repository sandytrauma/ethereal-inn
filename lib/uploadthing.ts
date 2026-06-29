import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 } 
  })
    // Ensure the metadata is explicitly handled
    .onUploadComplete(async ({ file }) => {
      // Log the full file object to debug the production 500 error 
      // in your Vercel logs if it happens again.
      console.log(`[UPLOADTHING] Upload Complete. URL: ${file.url}`);
      
      // Return a standardized object that your frontend components 
      // and database actions are guaranteed to parse correctly.
      return { 
        uploadedBy: "TenantSystem", 
        url: file.url,
        key: file.key,
        name: file.name
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
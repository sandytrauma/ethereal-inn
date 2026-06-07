// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

/**
 * CORE STORAGE SERVER GATEWAY
 * Dynamically registers GET and POST handlers to negotiate pre-signed 
 * processing tickets with the UploadThing edge storage engines.
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // config: { ... } // Optional custom options if required downstream
});
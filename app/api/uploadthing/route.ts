import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Explicitly pass the token from your environment
    token: process.env.UPLOADTHING_TOKEN,
  },
});
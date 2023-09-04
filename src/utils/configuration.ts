import { z } from "zod";

export const configuration = z
  .object({
    appId: z.string(),
    privateKey: z.string(),
    webhooks: z.object({
      secret: z.string(),
    }),
    oauth: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }),
  })
  .parse({
    appId: process.env.GH_APP_ID,
    privateKey: process.env.GH_PRIVATE_KEY,
    webhooks: { secret: process.env.GH_WEBHOOK_SECRET },
    oauth: {
      clientId: process.env.GH_CLIENT_ID,
      clientSecret: process.env.GH_CLIENT_SECRET,
    },
  });

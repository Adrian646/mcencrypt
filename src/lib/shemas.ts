import { z } from "zod";

export const requiredManifest = z.object({
    header: z.object({
        name: z.string().max(200, "Pack needs to have a valid pack name that is at most 200 characters long"),
        uuid: z.string().uuid("Pack needs a valid uuid v4")
    }).passthrough()
}).passthrough()
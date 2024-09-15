import * as z from "zod";

export const RendezveuxValidation = z.object({
  rendezveux: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  accountId: z.string(),
});

export const CommentValidation = z.object({
  rendezveux: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
});

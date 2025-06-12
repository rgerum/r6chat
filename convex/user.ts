import { QueryCtx } from "./_generated/server";

export async function getUserId(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject;
}

export async function getUserIdOrThrow(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Unauthenticated call to mutation");
  }
  return identity.subject;
}

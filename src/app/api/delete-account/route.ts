import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete all user data from Convex
    await convex.mutation(api.deleteUserData.deleteAllUserData, {
      userId: userId,
    });

    const client = await clerkClient();

    // Delete the user from Clerk using the server-side client
    await client.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

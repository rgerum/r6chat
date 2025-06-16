"use client";
import { Authenticated } from "convex/react";
import ProfilePage from "@/app/profile/ProfilePage";

export default function Page() {
  return (
    <Authenticated>
      <ProfilePage />
    </Authenticated>
  );
}

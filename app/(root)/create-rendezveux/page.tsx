import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import PostRendezveux from "@/components/forms/PostRendezveux";
import { fetchUser } from "@/lib/actions/user.actions";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  // fetch organization list created by user
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className='head-text'>Create your Rendezveux</h1>

      <PostRendezveux userId={userInfo._id} />
    </>
  );
}

export default Page;

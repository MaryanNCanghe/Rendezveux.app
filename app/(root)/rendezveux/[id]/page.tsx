import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

import Comment from "@/components/forms/Comment";
import RendezveuxCard from "@/components/cards/RendezveuxCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchRendezveuxById } from "@/lib/actions/rendezveux.actions";

export const revalidate = 0;

async function page({ params }: { params: { id: string } }) {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const rendezveux = await fetchRendezveuxById(params.id);

  return (
    <section className='relative'>
      <div>
        <RendezveuxCard
          id={rendezveux._id}
          currentUserId={user.id}
          parentId={rendezveux.parentId}
          content={rendezveux.text}
          author={rendezveux.author}
          community={rendezveux.community}
          createdAt={rendezveux.createdAt}
          comments={rendezveux.children}
        />
      </div>

      <div className='mt-7'>
        <Comment
          rendezveuxId={params.id}
          currentUserImg={user.imageUrl}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className='mt-10'>
        {rendezveux.children.map((childItem: any) => (
          <RendezveuxCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user.id}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment
          />
        ))}
      </div>
    </section>
  );
}

export default page;

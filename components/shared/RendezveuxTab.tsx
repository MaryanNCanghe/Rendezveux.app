import { redirect } from "next/navigation";

import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { fetchUserPosts } from "@/lib/actions/user.actions";

import RendezveuxCard from "../cards/RendezveuxCard";

interface Result {
  name: string;
  image: string;
  id: string; 
  rendezveux: {
    _id: string;
    text: string;
    parentId: string | null;
    author: {
      name: string;
      image: string;
      id: string;
    };
    community: {
      id: string;
      name: string;
      image: string;
    } | null;
    createdAt: string;
    children: {
      author: {
        image: string;
      };
    }[];
  }[];
}

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

async function RendezveuxsTab({ currentUserId, accountId, accountType }: Props) {
  let result: Result;

  if (accountType === "Community") {
    result = await fetchCommunityPosts(accountId);
  } else {
    result = await fetchUserPosts(accountId);
  }

  if (!result) {
    redirect("/");
  }

  return (
    <section className='mt-9 flex flex-col gap-10'>
      {result.rendezveux.map((rendezveux) => (
        <RendezveuxCard
          key={rendezveux._id}
          id={rendezveux._id}
          currentUserId={currentUserId}
          parentId={rendezveux.parentId}
          content={rendezveux.text}
          author={
            accountType === "User"
              ? { name: result.name, image: result.image, id: result.id }
              : {
                  name: rendezveux.author.name,
                  image: rendezveux.author.image,
                  id: rendezveux.author.id,
                }
          }
          community={
            accountType === "Community"
              ? { name: result.name, id: result.id, image: result.image }
              : rendezveux.community
          }
          createdAt={rendezveux.createdAt}
          comments={rendezveux.children}
        />
      ))}
    </section>
  );
}

export default RendezveuxsTab;

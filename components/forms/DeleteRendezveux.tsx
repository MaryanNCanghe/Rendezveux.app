"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { deleteRendezveux } from "@/lib/actions/rendezveux.actions";

interface Props {
  rendezveuxId: string;
  currentUserId: string;
  authorId: string;
  parentId: string | null;
  isComment?: boolean;
}

function DeleteRendezveux({
  rendezveuxId,
  currentUserId,
  authorId,
  parentId,
  isComment,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  if (currentUserId !== authorId || pathname === "/") return null;

  return (
    <Image
      src='/assets/delete.svg'
      alt='delte'
      width={18}
      height={18}
      className='cursor-pointer object-contain'
      onClick={async () => {
        await deleteRendezveux(JSON.parse(rendezveuxId), pathname);
        if (!parentId || !isComment) {
          router.push("/");
        }
      }}
    />
  );
}

export default DeleteRendezveux;

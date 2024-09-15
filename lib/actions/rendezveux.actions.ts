"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Rendezveux from "../models/rendezveux.model";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level ) 
  const postsQuery = Rendezveux.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });

  // Count the total number of top-level posts 
  const totalPostsCount = await Rendezveux.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createRendezveux({ text, author, communityId, path }: Params
) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdRendezveux = await Rendezveux.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { Rendezveux: createdRendezveux._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { Rendezveux: createdRendezveux._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create : ${error.message}`);
  }
}

async function fetchAllChildRendezveuxs(rendezveuxId: string): Promise<any[]> {
  const childRendezveux = await Rendezveux.find({ parentId: rendezveuxId });

  const descendantRendezveux = [];
  for (const childRendezveuxs of childRendezveux) {
    const descendants = await fetchAllChildRendezveuxs(childRendezveuxs._id);
    descendantRendezveux.push(childRendezveux, ...descendants);
  }

  return descendantRendezveux;
}

export async function deleteRendezveux(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the rendezveux to be deleted 
    const mainRendezveux = await Rendezveux.findById(id).populate("author community");

    if (!mainRendezveux) {
      throw new Error(" not found");
    }

    // Fetch all child  and their descendants recursively
    const descendantRendezveux = await fetchAllChildRendezveuxs(id);

    // Get all descendant rendez IDs including the main ID and child IDs
    const descendantRendezveuxIds = [
      id,
      ...descendantRendezveux.map((rendezveux) => rendezveux._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantRendezveux.map((rendezveux) => rendezveux.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainRendezveux.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantRendezveux.map((rendezveux) => rendezveux.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainRendezveux.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child and their descendants
    await Rendezveux.deleteMany({ _id: { $in: descendantRendezveuxIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { rendezveux: { $in: descendantRendezveux } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { rendezveux: { $in: descendantRendezveuxIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete : ${error.message}`);
  }
}

export async function fetchRendezveuxById(rendezveuxId: string) {
  connectToDB();

  try {
    const rendezveux = await Rendezveux.findById(rendezveuxId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Rendezveux, 
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .exec();

    return rendezveux;
  } catch (err) {
    console.error("Error while fetching:", err);
    throw new Error("Unable to fetch");
  }
}

export async function addCommentToRendezveux(
  rendezveuxId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original by its ID
    const originalRendezveux = await Rendezveux.findById(rendezveuxId);

    if (!originalRendezveux) {
      throw new Error("not found");
    }

    // Create the new comment 
    const commentRendezveux = new Rendezveux({
      text: commentText,
      author: userId,
      parentId: rendezveuxId, // Set the parentId to the original ID
    });

    // Save the comment to the database
    const savedCommentRendezveux = await commentRendezveux.save();

    // Add the comment  ID to the original  children array
    originalRendezveux.children.push(savedCommentRendezveux._id);

    // Save the updated original  to the database
    await originalRendezveux.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/utils/config";

export async function GET(request: NextRequest) {
  try {
    // Fetch files using Pinata SDK
    const files: any[] = await pinata.listFiles().pageLimit(100); // Response is an array

    console.log("Pinata files response:", files); // Debugging response structure

    // Process each file to fetch its content
    const posts = await Promise.all(
      files.map(async (file: any) => {
        if (file.mime_type === "application/json") {
          const fileUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`;
          const response = await fetch(fileUrl);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch content for CID: ${file.ipfs_pin_hash}`
            );
          }

          const content = await response.json();

          return {
            name: file.metadata?.name || "Unnamed File",
            cid: file.ipfs_pin_hash,
            size: file.size,
            createdAt: file.date_pinned,
            content, // Parsed JSON content
          };
        }
        return null; // Skip non-JSON files
      })
    );

    // Filter out null values (non-JSON files)
    const validPosts = posts.filter((post) => post !== null);

    return NextResponse.json(validPosts, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts from Pinata:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts from Pinata" },
      { status: 500 }
    );
  }
}

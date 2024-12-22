"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";
import Lenis from "lenis";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  const [title, setTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [imageUrlError, setImageUrlError] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, // Adjust scroll duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Optional easing function
      smoothWheel: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup on component unmount
  }, []);

  const uploadPost = async () => {
    try {
      if (!title || !systemPrompt || !imageUrl) {
        alert("All fields are required");
        return;
      }

      setUploading(true);

      const postData = {
        title,
        systemPrompt,
        imageUrl,
      };

      const file = new Blob([JSON.stringify(postData)], {
        type: "application/json",
      });
      const data = new FormData();
      data.set("file", file, `${title.replace(/\s+/g, "_")}.json`);

      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });

      const ipfsResponse = await uploadRequest.json();
      setPosts((prevPosts: any) => [
        {
          content: postData,
          url: ipfsResponse,
        },
        ...prevPosts,
      ]);
      setUploading(false);

      // Reset form fields
      setTitle("");
      setSystemPrompt("");
      setImageUrl("");
    } catch (e) {
      console.error(e);
      setUploading(false);
      alert("Trouble uploading post");
    }
  };

  const fetchPosts = async (setPosts: (posts: any) => void) => {
    try {
      setLoading(true);
      const response = await fetch("/api/pinata-files");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const posts = await response.json();
      console.log("Fetched Posts from Pinata:", posts);
      setPosts(posts);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts(setPosts);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setTitleError(value.length > 100);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setImageUrl(value);
    setImageUrlError(value.length > 100);
  };

  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setSystemPrompt(value);
  };

  const isDisabled =
    !title ||
    !systemPrompt ||
    !imageUrl ||
    titleError ||
    imageUrlError ||
    systemPrompt.length > 1200;

  return (
    <>
      <Head>
        <title>0xEntity</title>
      </Head>
      <main className="w-full min-h-screen flex gap-9 p-4">
        {/* Fixed Left Card */}
        <div className="w-1/3">
          <div className="fixed w-1/3">
            <Card className="w-full shadow-md mb-4">
              <CardHeader>
                <h2 className="text-2xl font-bold">0xEntity</h2>
                <div className="flex gap-2">
                  <p>home</p>
                  <Link href="/about" className="text-white">
                    <p>about</p>
                  </Link>
                </div>
                {/* 
              <p className="text-sm text-gray-400">
                Please donate to keep the project running:
              </p> */}
                <p className="text-sm text-gray-400">
                  Donate: ETH 0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E
                </p>
              </CardHeader>
            </Card>
            <Card className="w-full shadow-md mb-4">
              <CardHeader>
                <h2 className="text-2xl font-bold">Manifest a New Ai Entity</h2>
                <p>Caution: Entities are incredibly powerful.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={handleTitleChange}
                  className={`w-full ${titleError ? "border-red-500" : ""}`}
                />
                {titleError && (
                  <p className="text-red-500 text-sm">
                    Title exceeds 100 characters.
                  </p>
                )}
                <Textarea
                  placeholder="System Prompt (long text)"
                  value={systemPrompt}
                  onChange={handleSystemPromptChange}
                  className="w-full h-44 relative"
                  maxLength={1200}
                />
                <div className="text-gray-400 text-xs text-right mt-1">
                  {systemPrompt.length}/1200
                </div>
                <Input
                  placeholder="Entity Profile Image URL"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  className={`w-full ${imageUrlError ? "border-red-500" : ""}`}
                />
                {imageUrlError && (
                  <p className="text-red-500 text-sm">
                    Image URL exceeds 100 characters.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={uploadPost}
                  disabled={isDisabled || uploading}
                  className="w-full">
                  {uploading ? "Uploading..." : "Upload Entity Seed"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Posts Feed */}
        <section className="w-2/3 ml-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center mt-8">
              <Loader className="animate-spin w-7 h-7" />
            </div>
          )}
          {posts.map((post: any, index: number) => (
            <Card key={index} className="shadow-md mb-4">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {post.content?.imageUrl && (
                    <div className="w-16 h-16 overflow-hidden rounded-md border">
                      <img
                        src={post.content.imageUrl}
                        alt="Post Thumbnail"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-300">Entity:</p>
                    <h3 className="text-xl font-semibold">
                      {post.content?.title || "Untitled Post"}
                    </h3>
                    {post.cid && (
                      <b className="text-xs text-gray-500 mt-1">
                        CID: <span className="">ipfs://{post.cid}</span>
                      </b>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-[#161616] p-4 rounded-md border">
                  <p
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ wordBreak: "break-word" }}>
                    {post.content?.systemPrompt || "No content available"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      post.content?.systemPrompt || ""
                    )
                  }
                  className="w-40 mt-4 h-7 text-xs bg-[#383838] hover:bg-[#464646] px-2 py-1 rounded-md">
                  Copy Seed
                </button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </>
  );
}

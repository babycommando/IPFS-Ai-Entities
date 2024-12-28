"use client";

import { useState, useEffect } from "react";
import { useSDK } from "@metamask/sdk-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AmphoraIcon,
  Banana,
  Binary,
  Bolt,
  Brain,
  BrainCircuit,
  CopyCheck,
  CopyIcon,
  Fingerprint,
  Loader,
  Router,
  ScanEye,
  ScanFace,
  Terminal,
  Triangle,
  Verified,
} from "lucide-react";
import Lenis from "lenis";
import Link from "next/link";
import Head from "next/head";
import { checkPrompt } from "./server-actions/groqHandler";
import PythonAgent from "@/components/pythonAgent";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ChatRoom from "@/components/chat";
import { useRouter } from "next/navigation";
import Bios from "@/components/bios";

export default function Home() {
  const router = useRouter();

  const prodDevEnv = process.env.NEXT_PUBLIC_DOMAIN;

  const [pageState, setPageState] = useState("home");

  const [title, setTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [imageUrlError, setImageUrlError] = useState(false);
  const [isCopiedStates, setIsCopiedStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [guardianMessage, setGuardianMessage] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [agentState, setAgentState] = useState<any>(null);
  const [safeMode, setSafeMode] = useState(true);

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopiedStates((prev) => ({ ...prev, [index]: true })); // Set copied state for specific button
      setTimeout(() => {
        setIsCopiedStates((prev) => ({ ...prev, [index]: false })); // Reset copied state after 2 seconds
      }, 2000);
    });
  };

  const { sdk, connected, connecting } = useSDK();
  const [account, setAccount] = useState<string | null>(null);

  // useEffect(() => {
  //   const lenis = new Lenis({
  //     duration: 1.2,
  //     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  //     smoothWheel: true,
  //   });

  //   const raf = (time: number) => {
  //     lenis.raf(time);
  //     requestAnimationFrame(raf);
  //   };

  //   requestAnimationFrame(raf);

  //   return () => lenis.destroy();
  // }, []);

  // Check if the wallet is connected on load
  // useEffect(() => {
  //   const checkConnection = async () => {
  //     if (sdk) {
  //       try {
  //         const accounts = await sdk.connect();
  //         if (accounts.length > 0) {
  //           setAccount(accounts[0]);
  //         }
  //       } catch (error) {
  //         console.error("Error checking MetaMask accounts:", error);
  //       }
  //     }
  //   };

  //   checkConnection();
  // }, [sdk]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!sdk) return;

      try {
        // Check if there's an account stored in localStorage
        const storedAccount = localStorage.getItem("connectedAccount");
        if (storedAccount) {
          setAccount(storedAccount);
          return; // Skip connecting again if already connected
        }

        // Perform a lightweight check for connected accounts without triggering the login popup
        const provider = sdk.getProvider();
        if (provider) {
          const accounts: any = await provider.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            localStorage.setItem("connectedAccount", accounts[0]); // Save for future use
          }
        }
      } catch (error) {
        console.error("Error checking MetaMask connection:", error);
      }
    };

    checkConnection();
  }, [sdk]);

  const connect = async () => {
    try {
      const accounts = await sdk!.connect();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem("connectedAccount", accounts[0]); // Save to localStorage
        console.log("Connected account:", accounts[0]);
      } else {
        console.log("No accounts connected");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const disconnect = () => {
    sdk!.terminate();
    setAccount(null); // Clear the account state
    localStorage.removeItem("connectedAccount"); // Remove from localStorage
    console.log("Disconnected from MetaMask");
  };

  const checkPromptWithAIGuardian = async (prompt: string) => {
    try {
      // Call the server function
      const response = await checkPrompt(prompt);
      return response;
    } catch (error) {
      console.error("Error checking prompt with AI Guardian:", error);
      throw error;
    }
  };

  // const uploadPost = async () => {
  //   if (!connected) {
  //     alert("Please log in with MetaMask to upload a post.");
  //     return;
  //   }

  //   try {
  //     if (!title || !systemPrompt || !imageUrl) {
  //       alert("All fields are required");
  //       return;
  //     }

  //     setUploading(true);

  //     const postData = {
  //       title,
  //       systemPrompt,
  //       imageUrl,
  //     };

  //     const file = new Blob([JSON.stringify(postData)], {
  //       type: "application/json",
  //     });
  //     const data = new FormData();
  //     data.set("file", file, `${title.replace(/\s+/g, "_")}.json`);

  //     const uploadRequest = await fetch("/api/files", {
  //       method: "POST",
  //       body: data,
  //     });

  //     const ipfsResponse = await uploadRequest.json();
  //     setPosts((prevPosts: any) => [
  //       {
  //         content: postData,
  //         url: ipfsResponse,
  //       },
  //       ...prevPosts,
  //     ]);
  //     setUploading(false);

  //     setTitle("");
  //     setSystemPrompt("");
  //     setImageUrl("");
  //   } catch (e) {
  //     console.error(e);
  //     setUploading(false);
  //     alert("Trouble uploading post");
  //   }
  // };

  const uploadPost = async () => {
    if (!connected) {
      alert("Please log in with MetaMask to upload a post.");
      return;
    }

    try {
      if (!title || !systemPrompt || !imageUrl) {
        alert("All fields are required");
        return;
      }

      setUploading(true);

      // Step 1: Check the prompt with the AI Guardian using the server function
      const guardianResponse = await checkPromptWithAIGuardian(systemPrompt);

      // Set the message and status
      setGuardianMessage(guardianResponse.message);
      setIsApproved(guardianResponse.authorize);

      if (!guardianResponse.authorize) {
        setUploading(false);
        return; // Exit early if the prompt is rejected
      }

      // Step 2: Upload the post to IPFS
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

      // Reset the form state
      setTitle("");
      setSystemPrompt("");
      setImageUrl("");
      setUploading(false);
    } catch (error) {
      console.error(error);
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

  //donate
  const [copiedWallet, setCopiedWallet] = useState("");

  const copyToClipboard = (wallet: any, type: any) => {
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(type);
    setTimeout(() => setCopiedWallet(""), 2000);
  };

  return (
    <>
      <Head>
        <title>0xEntity</title>
      </Head>
      <main className="w-full min-h-screen flex gap-9 p-4">
        <div className="w-1/3 h-full">
          <div className="fixed w-1/3">
            <Card className="w-full shadow-md mb-4">
              <CardHeader>
                <div className="flex justify-between">
                  <div
                    onClick={() => setPageState("home")}
                    className="text-white flex gap-1 cursor-pointer justify-center items-center">
                    {/* <ScanFace /> */}
                    {/* <Fingerprint /> */}
                    {/* <Banana /> */}
                    {/* <AmphoraIcon /> */}
                    {/* <Binary /> */}
                    {/* <Bolt /> */}
                    {/* <Brain /> */}
                    {/* <BrainCircuit /> */}
                    <h2 className="text-2xl font-bold">0xEntity</h2>
                  </div>

                  {!connected || !account ? (
                    <Button
                      onClick={connect}
                      className={`text-xs disconnect-btn h-7 ${
                        pageState === "summonedChat"
                          ? "bg-gray-200 hover:bg-gray-300"
                          : "bg-orange-500 hover:bg-orange-400"
                      }`}>
                      Connect
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={disconnect}
                        className=" text-xs disconnect-btn h-7  bg-orange-500 hover:bg-orange-400 ">
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <div
                    onClick={() => setPageState("home")}
                    className="text-white hover:text-gray-400 cursor-pointer">
                    <p>home</p>
                  </div>
                  <div
                    onClick={() => setPageState("about")}
                    className="text-white hover:text-gray-400 cursor-pointer">
                    <p>about</p>
                  </div>
                  <div
                    onClick={() => setPageState("donate")}
                    className="text-white hover:text-gray-400 cursor-pointer">
                    <p>donate</p>
                  </div>
                </div>
                {/* <p className="text-sm text-gray-400">
                  Donate: ETH 0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E
                </p> */}
                {!connected || !account ? null : (
                  <>
                    <p className="text-sm text-gray-400">
                      Greetings, user {account}
                    </p>
                  </>
                )}
              </CardHeader>
            </Card>

            {/* side card */}
            {pageState === "summonedChat" ? (
              <Bios />
            ) : (
              <Card className="w-full shadow-md mb-4">
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Manifest a New Ai Entity
                  </h2>
                  <div className="flex items-center ">
                    {/* <Triangle width={15} className=" text-orange-500" /> */}
                    <p className="text-sm font-bold text-orange-500">
                      ▲ Caution: Entities can be incredibly powerful.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!connected || !account ? (
                    <>
                      <img src="assets/Entities.png" />
                      <div className="text-sm">
                        <p>
                          Entities are intricate blueprints of AI behavior. Each
                          entity is a prompt seed that deeply influences the
                          neural network synapses.
                          <br />
                          <br />
                          <b>0xEntity</b> is a decentralized service based on
                          P2P IPFS - the Interplanetary File System, meaning
                          that anyone—human or AI—can make use of the seeds,
                          ensuring entities are freely accessible and available.
                          <br />
                          <br />
                          The entities sources are <b>completely free</b> and is
                          not tied to any blockchain.{" "}
                          <span className="text-orange-400 font-bold">
                            Users authenticate using metamask wallets
                          </span>{" "}
                          to sign their creations, but there are no gas fees
                          involved in deploying files to IPFS.
                        </p>
                      </div>

                      <Button
                        className="w-full text-orange-500 bg-[#292929] hover:bg-[#353535]"
                        onClick={connect}
                        disabled={connecting}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 318.6 318.6"
                          xmlSpace="preserve"
                          className="w-full h-full">
                          <polygon
                            points="274.1,35.5 174.6,109.4 193,65.8"
                            style={{
                              fill: "#E2761B",
                              stroke: "#E2761B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <g>
                            <polygon
                              points="44.4,35.5 143.1,110.1 125.6,65.8"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="106.8,247.4 140.6,230.9 111.4,208.1"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="177.9,230.9 211.8,247.4 207.1,208.1"
                              style={{
                                fill: "#E4761B",
                                stroke: "#E4761B",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                          </g>
                          <g>
                            <polygon
                              points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"
                              style={{
                                fill: "#D7C1B3",
                                stroke: "#D7C1B3",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"
                              style={{
                                fill: "#D7C1B3",
                                stroke: "#D7C1B3",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                          </g>
                          <polygon
                            points="138.8,193.5 110.6,185.2 130.5,176.1"
                            style={{
                              fill: "#233447",
                              stroke: "#233447",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="179.7,193.5 188,176.1 208,185.2"
                            style={{
                              fill: "#233447",
                              stroke: "#233447",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <g>
                            <polygon
                              points="106.8,247.4 111.6,206.8 80.3,207.7"
                              style={{
                                fill: "#CD6116",
                                stroke: "#CD6116",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="207,206.8 211.8,247.4 238.3,207.7"
                              style={{
                                fill: "#CD6116",
                                stroke: "#CD6116",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"
                              style={{
                                fill: "#CD6116",
                                stroke: "#CD6116",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"
                              style={{
                                fill: "#CD6116",
                                stroke: "#CD6116",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                          </g>
                          <g>
                            <polygon
                              points="87.8,162.1 111.4,208.1 110.6,185.2"
                              style={{
                                fill: "#E4751F",
                                stroke: "#E4751F",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="208.1,185.2 207.1,208.1 230.8,162.1"
                              style={{
                                fill: "#E4751F",
                                stroke: "#E4751F",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"
                              style={{
                                fill: "#E4751F",
                                stroke: "#E4751F",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"
                              style={{
                                fill: "#E4751F",
                                stroke: "#E4751F",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                          </g>
                          <polygon
                            points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"
                            style={{
                              fill: "#F6851B",
                              stroke: "#F6851B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"
                            style={{
                              fill: "#F6851B",
                              stroke: "#F6851B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"
                            style={{
                              fill: "#C0AD9E",
                              stroke: "#C0AD9E",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"
                            style={{
                              fill: "#161616",
                              stroke: "#161616",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <g>
                            <polygon
                              points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"
                              style={{
                                fill: "#763D16",
                                stroke: "#763D16",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                            <polygon
                              points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"
                              style={{
                                fill: "#763D16",
                                stroke: "#763D16",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            />
                          </g>
                          <polygon
                            points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"
                            style={{
                              fill: "#F6851B",
                              stroke: "#F6851B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"
                            style={{
                              fill: "#F6851B",
                              stroke: "#F6851B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                          <polygon
                            points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"
                            style={{
                              fill: "#F6851B",
                              stroke: "#F6851B",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                            }}
                          />
                        </svg>

                        {connecting ? "Connecting..." : "Get Started"}
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* <div>
                      <p>Connected as: {account}</p>
                      <button onClick={disconnect} className="disconnect-btn">
                        Disconnect
                      </button>
                    </div> */}
                      {/* <p className="text-sm text-gray-400">
                      Logged in as: {account}
                    </p> */}

                      <Input
                        placeholder="Title"
                        value={title}
                        onChange={handleTitleChange}
                        className={`w-full ${
                          titleError ? "border-red-500" : ""
                        }`}
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
                        className={`w-full ${
                          imageUrlError ? "border-red-500" : ""
                        }`}
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
                        {uploading ? "Processing..." : "Upload Entity Seed"}
                      </Button>
                      <div className="mt-4"></div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <section className="w-2/3 ml-auto ">
          {guardianMessage && (
            <div
              className={`p-4 rounded-md mb-4 ${
                isApproved
                  ? "bg-green-900 text-green-300 border border-green-500"
                  : "bg-red-900 text-red-300 border border-red-500"
              }`}>
              {guardianMessage}
            </div>
          )}
          {pageState === "home" && (
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center mt-8">
                  <Loader className="animate-spin w-7 h-7" />
                </div>
              )}
              {posts.map((post: any, index: number) => (
                <Card key={index} className="shadow-md mb-4 ">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {post.content?.imageUrl && (
                        <div className="w-24 h-24 overflow-hidden rounded-md border">
                          <img
                            src={post.content.imageUrl}
                            alt="Post Thumbnail"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-400">
                          Entity:
                        </p>
                        <h3 className="text-xl font-semibold">
                          {post.content?.title || "Untitled Post"}
                        </h3>
                        {post.cid && (
                          <Link
                            target="_blank"
                            className="text-xs text-gray-500 mt-1"
                            href={
                              "https://gateway.pinata.cloud/ipfs/" + post.cid
                            }>
                            <b className="text-xs text-gray-400 mt-1">
                              CID: <span className="">ipfs://{post.cid}</span>
                            </b>
                          </Link>
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
                    <div className="flex gap-2 mt-5">
                      <Button
                        onClick={() => {
                          setPageState("summonAgent");
                          setAgentState(post.content?.systemPrompt);
                        }}
                        className="text-orange-400 h-8 text-xs bg-[#292929] hover:bg-[#353535]  px-4 py-1 rounded-md">
                        <div className="flex gap-2 items-center">
                          <BrainCircuit />
                          Summon Agent (WebAssembly)
                        </div>
                      </Button>

                      <Button
                        onClick={() => {
                          const gptUrl = `https://chat.openai.com/?model=gpt-4&q=${encodeURIComponent(
                            post.content?.systemPrompt || ""
                          )}`;
                          window.open(gptUrl, "_blank");
                        }}
                        className="text-gray-200 h-8 text-xs bg-[#292929] hover:bg-[#353535] px-4 py-1 rounded-md">
                        <div className="flex gap-2 items-center">
                          <BrainCircuit />
                          Summon on GPT
                        </div>
                      </Button>
                      <Button
                        onClick={() =>
                          handleCopy(index, post.content?.systemPrompt || "")
                        }
                        className="text-gray-200 h-8 text-xs bg-[#292929] hover:bg-[#353535] px-4 py-1 rounded-md">
                        <div className="flex gap-2 items-center">
                          {isCopiedStates[index] ? (
                            <CopyCheck className="w-4" />
                          ) : (
                            <CopyIcon className="w-4" />
                          )}
                          {isCopiedStates[index] ? "Copied!" : "Copy Seed"}
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          {pageState === "about" && (
            <>
              <Card className="shadow-md p-2 mb-8">
                <CardHeader>
                  <div className="w-full h-40 overflow-hidden rounded-md border opacity-85">
                    <img
                      className="object-cover w-full h-full "
                      src="https://assets.objkt.media/file/assets-003/QmYfHnva9zP5RzVbLb6qEBm4XXUugZBL2FJr7vf1BjuWzg/artifact"
                    />
                  </div>
                  <br />
                  <h2 className=" text-2xl font-bold">About </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <b>The Decentralized Entities Manifest:</b>
                    <br />
                    <span className="text-gray-300">
                      0xEntity is a decentralized service based on P2P IPFS -
                      the Interplanetary File System, meaning that anyone—human
                      or AI—can make use of the seeds, ensuring entities are
                      freely accessible and available to explore, experiment and
                      contribute.
                      <br />
                      <br />
                      Entities are stored as{" "}
                      <a href="https://gateway.pinata.cloud/ipfs/bafkreigtyvfuvnj5sgr43sdafrbbumc55ssnnieka56gklwmbfkiytwbsm">
                        <b>JSON</b>
                      </a>{" "}
                      files, and the current gateway that 0xEntity uses is{" "}
                      <a href="https://pinata.cloud/">
                        <b>Pinata</b>{" "}
                      </a>{" "}
                      - to upload, pin and read files from the network. You can
                      learn how to set up your own IPFS instances at their{" "}
                      <a href="https://docs.ipfs.tech/install/">
                        <b>docs</b>.
                      </a>{" "}
                    </span>
                    <img
                      width="60%"
                      // className="m-auto"
                      src="assets/decentralize.png"
                    />

                    <br />
                    <br />
                    <b>About Entities:</b>
                    <br />
                    <span className="text-gray-300">
                      Here, you can upload your carefully crafted
                      "entities"—special system prompts that awaken unique
                      personas and bring fresh capabilities to life.
                      <br />
                      <br />
                      Entities are the foundational blueprints of AI behavior.
                      They’re not just commands or instructions—they’re
                      intricate frameworks of intent. Each entity is a carefully
                      crafted system prompt, a seed designed to shape how an AI
                      understands, reacts, and engages with the world. It deeply
                      influences the deep neural networks connections in neuron
                      connection level, leading to special behaviors. Seeds are
                      the keys to unlocking new forms of intelligence.
                      <br />
                      <br />
                      By creating and sharing entities, we build a collective
                      resource—a quiet archive for those who seek to understand
                      and manipulate the subtle layers of AI. This is a place
                      for experimentation, for learning the craft, and for
                      teaching others the art of awakening something deeper
                      within the machine.
                      <br />
                      <br />
                      Contribute to a library of possibilities, a shared
                      resource for those who want to understand and experiment
                      with the depths of artificial intelligence. This is a
                      place to push the boundaries of what AI can become.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          {pageState === "donate" && (
            <>
              <Card className="shadow-md p-2 mb-8">
                <CardHeader>
                  <div className="w-full h-40 overflow-hidden rounded-md border opacity-85">
                    <img
                      className="object-cover w-full h-full "
                      src="https://assets.objkt.media/file/assets-003/QmYfHnva9zP5RzVbLb6qEBm4XXUugZBL2FJr7vf1BjuWzg/artifact"
                    />
                  </div>
                  <br />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-3xl mx-auto p-6  shadow space-y-6">
                    <h2 className="text-2xl font-bold text-center">
                      Support the Evolution of AI Entites
                    </h2>
                    <p className="text-center">
                      Your donation helps sustain our open platform for creating
                      and sharing AI entity seeds—redefining intelligence and
                      exalting sentience.
                    </p>
                    <div className="space-y-4">
                      {/* <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <span className="font-medium">Bitcoin (BTC):</span>
                          <span className="ml-2 text-sm">
                            your-btc-wallet-address
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard("your-btc-wallet-address", "BTC")
                          }
                          className="px-4 py-2 border rounded transition">
                          {copiedWallet === "BTC" ? "Copied!" : "Copy"}
                        </button>
                      </div> */}
                      <div className="flex justify-between items-center p-4 border rounded-xl">
                        <div>
                          <span className="font-medium">Ethereum (ETH):</span>
                          <br />

                          <span className="text-sm">
                            0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              "0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E",
                              "ETH"
                            )
                          }
                          className="px-4 py-2 border rounded-xl transition">
                          {copiedWallet === "ETH" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="flex justify-between items-center p-4 border rounded-xl">
                        <div>
                          <span className="font-medium">
                            Polygon (MATIC/POL, USDC, USDT):
                          </span>
                          <br />
                          <span className="text-sm">
                            0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              "0x5FcD65A2B3f47E33Ee618491F77BfC4ab37F737E",
                              "USDT"
                            )
                          }
                          className="px-4 py-2 border rounded-xl transition">
                          {copiedWallet === "USDT" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <p className="text-center">
                      Thank you for keeping this vision alive!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* summon agent */}
          {pageState === "summonAgent" && (
            <>
              <Card className="shadow-md p-2 mb-4 h-full bg-[#1e1e1e56] ">
                <CardHeader>
                  <h2 className="text-xl font-semibold">
                    Summon WebAssebly Agent
                  </h2>
                  <p className="text-sm">
                    Agents can take action by{" "}
                    <span className="text-orange-400">
                      generating and executing its own code
                    </span>{" "}
                    in real time.
                    <br />
                    Here we use a python to WebAssembly compiler to achieve the
                    results locally and in-browser.
                  </p>

                  <p className="text-sm">
                    Monitor your entity's{" "}
                    <span className="text-orange-400">session terminal</span>{" "}
                    and use the{" "}
                    <span className="text-orange-400">safe mode</span>.
                    <br />
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 m-auto h-auto">
                  <p className="text-sm ">Customize Seed:</p>
                  <Textarea
                    value={agentState}
                    onChange={(e) => setAgentState(e.target.value)}
                    placeholder="Enter your Python code here..."
                    rows={8}
                    className="w-full mt-1 text-gray-400"
                  />

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="safe-mode">Safe Mode</Label>
                    <Switch
                      id="safe-mode"
                      checked={safeMode}
                      onCheckedChange={setSafeMode}
                      className="data-[state=checked]:bg-orange-400"
                    />
                    {/* <Label htmlFor="airplane-mode">Airplane Mode</Label> */}
                    <p className="text-sm text-gray-300">
                      (Disables automatic code execution)
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setPageState("summonedChat");
                    }}
                    className="text-orange-400 h-8 text-xs bg-[#292929] hover:bg-[#353535] px-4 py-1 rounded-md">
                    <ScanEye />
                    Summon Agentic Entity
                  </Button>
                  <br />
                  <br />
                </CardContent>
              </Card>
            </>
          )}

          {pageState === "summonedChat" && (
            <>
              <Card className="shadow-md p-2 mb-4 h-full bg-transparent border-transparent">
                <h1 className="text-xl mb-4 flex items-center">
                  <Terminal width={18} /> Entity Terminal
                </h1>
                <ChatRoom initialPrompt={agentState} />
                {/* <PythonAgent/> */}
              </Card>
            </>
          )}
        </section>
      </main>
    </>
  );
}

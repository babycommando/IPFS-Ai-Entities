"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { generateGroqMessage } from "@/app/server-actions/groqHandler";
import { EyeIcon } from "lucide-react";
import Emulator from "./emulator";
import VMPage from "./emulator";
import { Textarea } from "./ui/textarea";
import { useSDK } from "@metamask/sdk-react";
import Bios from "./bios";
import { generateResponse } from "@/app/server-actions/reasoning";

export type Message = {
  id: number;
  user: "user" | "ai" | "system";
  text: string;
};

type ChatRoomProps = {
  initialPrompt: string;
};

const ChatRoom: React.FC<ChatRoomProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), user: "system", text: "BOOTING ENTITY BIOS..." }, //initialPrompt
  ]);

  const [inputValue, setInputValue] = useState<string>("");
  const chatContainerRef = useRef<any>(null);
  const hasFetchedInitialResponse = useRef(false);

  useEffect(() => {
    if (hasFetchedInitialResponse.current) return; // Skip if already fetched

    hasFetchedInitialResponse.current = true; // Mark as fetched

    const fetchInitialResponse = async () => {
      // if (initialPrompt) {
      //   try {
      //     const aiResponse = await fetchResponse(initialPrompt);
      //     setMessages((prev) => [...prev, aiResponse]);
      //   } catch (error) {
      //     console.error("Error fetching initial response:", error);
      //   }
      // }
      console.log("uncomment to fetch response");
    };

    fetchInitialResponse();
  }, [initialPrompt]); // Runs only on initialPrompt change

  // Placeholder function for fetching responses from GROQ
  const fetchResponse = async (userInput: string): Promise<Message> => {
    try {
      // Call the generateGroqMessage function with the user's input
      const result = await generateGroqMessage(
        userInput,
        initialPrompt,
        messages
      );

      // Construct and return the Message object
      return {
        id: Date.now(),
        user: "ai",
        text: result || "No message returned", // Use the 'message' key from the response or a fallback
      };
    } catch (error) {
      console.error("Error fetching response:", error);

      // Return an error message in case of failure
      return {
        id: Date.now(),
        user: "ai",
        text:
          "An error occurred while generating the response. Please try again. " +
          error,
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      user: "user",
      text: inputValue.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Fetch AI response
    const aiResponse = await fetchResponse(newMessage.text);
    setMessages((prev) => [...prev, aiResponse]);

    // Parse AI's response
    try {
      console.log(aiResponse.text);

      // Parse the sanitized JSON
      const actionScriptParsed = JSON.parse(aiResponse.text);

      if (actionScriptParsed.AgentScript) {
        const { actions } = actionScriptParsed.AgentScript;
        console.log(actions);
        // Log and handle actions
        console.log("Actions from AgentScript:", actions);
        for (const action of actions) {
          if (action.type === "bash_execution") {
            console.log("Executing Bash Command:", action.command);
            // Execute the bash command dynamically if required
            sendCommand(action.command);
          } else {
            console.warn("Unsupported action type:", action.type);
          }
        }
      } else {
        console.warn("Invalid AgentScript structure:", actionScriptParsed);
      }
    } catch (error) {
      console.error("Error parsing AgentScript:", error);
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat container whenever messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ---------------------------------------------------------------------------------------------
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLTextAreaElement>(null);
  const emulatorRef = useRef<any>(null);
  const [output, setOutput] = useState<string>("");
  const [termInputValue, setTermInputValue] = useState<string>("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/v86/libv86.js"; // Ensure this path is correct in your public directory
    script.async = true;

    script.onload = () => {
      if (window.V86 && screenContainerRef.current) {
        const emulator = new window.V86({
          wasm_path: "/v86/v86.wasm",
          memory_size: 512 * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          screen_container: screenContainerRef.current,
          bios: { url: "/v86/bios/seabios.bin" },
          vga_bios: { url: "/v86/bios/vgabios.bin" },
          cdrom: { url: "/v86/images/alpine-virt.iso" },
          network_relay_url: "fetch",
          autostart: true,
        });

        emulatorRef.current = emulator;

        // Ensure emulator is fully initialized
        const restoreState = async () => {
          if (emulator) {
            try {
              console.log("Attempting to restore state...");
              // Fetch the state file as an ArrayBuffer
              const response = await fetch("/v86/states/alpine-state.bin");
              const state = await response.arrayBuffer(); // Get the state as ArrayBuffer
              await emulator.restore_state(state); // Restore the state
              console.log("State restored successfully.");
            } catch (error) {
              console.error("Failed to restore state:", error);
            }
          }
        };

        // Only restore the state after the emulator is ready
        restoreState();

        // Handling serial communication
        let serialData = "";
        const stages = [
          {
            test: "~% ",
            send: "ls -1 --color=never /\n",
          },
          {
            test: "~% ",
            send: "echo Hello from VM\n",
          },
        ];
        let stageIndex = 0;

        // Function to remove all ANSI escape codes
        const removeAnsiCodes = (input: string) => {
          // This regex will match most common ANSI escape codes (including cursor movement, colors, etc.)
          return input.replace(/\x1b\[[0-9;]*[mGfHJKfF]/g, "");
        };

        // Updated serial output listener
        emulator.add_listener("serial0-output-byte", (byte: number) => {
          const char = String.fromCharCode(byte);
          if (char === "\r") return;

          serialData += char;

          if (outputRef.current) {
            // Clean the serial output by removing any ANSI escape codes before updating the textarea
            const cleanedOutput = removeAnsiCodes(serialData);

            outputRef.current.value = cleanedOutput;
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }

          const currentStage = stages[stageIndex];
          if (currentStage && serialData.endsWith(currentStage.test)) {
            emulator.serial0_send(currentStage.send);
            if (logRef.current) {
              logRef.current.value += `Sent command: ${currentStage.send}\n`;
              logRef.current.scrollTop = logRef.current.scrollHeight;
            }
            stageIndex++;
          }
        });

        emulator.add_listener("emulator-ready", () => {
          if (logRef.current) {
            logRef.current.value += "Emulator is ready.\n";
            logRef.current.scrollTop = logRef.current.scrollHeight;
          }
        });
      } else {
        console.error(
          "v86 library not loaded or screen container not initialized."
        );
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const sendCommand = (command: string) => {
    const emulator = emulatorRef.current;
    if (emulator) {
      if (!emulator.is_running()) {
        console.error("Emulator is not running yet.");
        return;
      }
      try {
        emulator.serial0_send(`${command}\n`);
        if (logRef.current) {
          logRef.current.value += `Command sent: ${command}\n`;
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      } catch (error) {
        console.error("Error sending command:", error);
      }
    } else {
      console.error("Emulator is not initialized yet.");
    }
  };

  //-------------------------------------------------------------------------------------------------

  const { sdk, connected, connecting } = useSDK();
  const [account, setAccount] = useState<string | null>(null);
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

  return (
    <main className="w-full min-h-screen flex gap-9 p-4">
      <div className="w-1/3 h-full">
        <div className="fixed w-1/3">
          <Card className="w-full shadow-md mb-4">
            <CardHeader>
              <div className="flex justify-between">
                <div
                  onClick={() => console.log("home")}
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
                    className={
                      "text-xs disconnect-btn h-7 bg-gray-200 hover:bg-gray-300"
                    }>
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
                  onClick={() => console.log("home")}
                  className="text-white hover:text-gray-400 cursor-pointer">
                  <p>home</p>
                </div>
                <div
                  onClick={() => console.log("about")}
                  className="text-white hover:text-gray-400 cursor-pointer">
                  <p>about</p>
                </div>
                <div
                  onClick={() => console.log("donate")}
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
          <Bios />
        </div>
      </div>
      <div className="max-h-96 w-full flex flex-col">
        <div className=" flex flex-col w-full h-full rounded-lg text-pink-600 text-sm shadow-lg">
          {/* Chat messages container */}
          {/* <div className="flex-1 overflow-hidden"> */}
          <div
            ref={chatContainerRef}
            className="h-[75vh] overflow-y-auto   
          [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-thumb]:bg-neutral-700
          [&::-webkit-scrollbar-track]:rounded-full   
          [&::-webkit-scrollbar-thumb]:rounded-full
          ">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.user === "user" ? "justify-end" : "justify-start"
                }`}>
                <div
                  className={`p-3 rounded-lg 
                ${
                  message.user === "user" &&
                  "text-right bg-[#1e1e1e8d] mr-4 mb-4 mt-4 text-pink-700 max-w-[75%] "
                }
                ${
                  message.user === "ai" &&
                  "bg-[#1e1e1e8d] max-w-[75%] text-base"
                }
                ${
                  message.user === "system" &&
                  "bg-[#1e1e1e8d] mb-4 max-w-[100%] text-gray-400"
                }

                `}>
                  {message.user === "system" ? (
                    <div className="flex gap-1 items-center">
                      <EyeIcon width={14} />
                      {message.text}
                    </div>
                  ) : (
                    <>{message.text}</>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* </div> */}

          {/* Chat input */}
          <div className="mt-4 flex items-center p-4 border rounded-xl bg-[#1e1e1e85] shadow-md shadow-[#303030] backdrop-blur-sm">
            <Input
              type="text"
              className="flex-1 focus-visible:ring-0 focus:border-pink-600"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <Button
              onClick={handleSendMessage}
              className="ml-4 bg-[#292929] hover:bg-[#353535] text-pink-600">
              Send
            </Button>
          </div>
        </div>
        <br />
        <br />

        <div className="h-100">
          <Textarea
            ref={outputRef}
            readOnly
            rows={10}
            className="text-pink-600 focus-visible:ring-0 text-sm h-72 overflow-y-auto p-2 bg-[#161616] rounded-sm
            [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:bg-[#1e1e1e]
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:rounded-full"
            placeholder="Output"
          />

          <div className="mt-4 w-full flex items-center rounded-xl ">
            <Input
              type="text"
              className="flex-1 focus-visible:ring-0 focus:border-pink-600"
              placeholder="$ ENTITY:>"
              value={termInputValue}
              onChange={(e) => setTermInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendCommand(termInputValue);
                  setTermInputValue("");
                }
              }}
            />
          </div>
        </div>
        <br />
        <br />

        <div
          id="screen_container"
          ref={screenContainerRef}
          className=""
          style={{
            font: "13px monospace",
            lineHeight: "13px",
            width: "100%",
            zIndex: "10000",
            display: "none",
          }}>
          <ScrollArea className=""></ScrollArea>
          <canvas style={{ display: "none" }}></canvas>
        </div>
      </div>
    </main>
  );
};

export default ChatRoom;

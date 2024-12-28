"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { generateGroqMessage } from "@/app/server-actions/groqHandler";
import { EyeIcon } from "lucide-react";
import Emulator from "./emulator";
import VMPage from "./emulator";

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
      if (initialPrompt) {
        try {
          const aiResponse = await fetchResponse(initialPrompt);
          setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
          console.error("Error fetching initial response:", error);
        }
      }
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
  };

  useEffect(() => {
    // Scroll to the bottom of the chat container whenever messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
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
    </div>
  );
};

export default ChatRoom;

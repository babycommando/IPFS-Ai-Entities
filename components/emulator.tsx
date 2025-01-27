"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

declare global {
  interface Window {
    V86: any;
  }
}

const VMPage = () => {
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLTextAreaElement>(null);
  const emulatorRef = useRef<any>(null);
  const [output, setOutput] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

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

  return (
    <div>
      {/* <div style={{ marginTop: "10px" }}>
        <button onClick={() => sendCommand("ls")}>Run "ls"</button>
        <button onClick={() => sendCommand("echo Hello World")}>
          Run "echo Hello World"
        </button>
        <button onClick={() => sendCommand("dmesg")}>Run "dmesg"</button>
      </div> */}

      {/* LOGGER */}
      {/* <textarea
        ref={logRef}
        readOnly
        rows={10}
        style={{
          marginTop: "20px",
          width: "100%",
          backgroundColor: "#111",
          color: "#0f0",
          fontFamily: "monospace",
        }}
        placeholder="Logs"
      /> */}

      {/* PINK TERM */}
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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendCommand(inputValue);
              setInputValue("");
            }
          }}
        />
      </div>

      {/* BIG TERM */}
      <div className="">
        <div
          id="screen_container"
          ref={screenContainerRef}
          className=""
          style={{
            font: "13px monospace",
            lineHeight: "13px",
            width: "100%",
            zIndex: "10000",
            // display: "none",
          }}>
          <ScrollArea className=""></ScrollArea>
          <canvas style={{ display: "none" }}></canvas>
        </div>
      </div>
    </div>
  );
};

export default VMPage;

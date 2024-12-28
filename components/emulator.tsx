// "use client";
// import React, { useEffect, useRef } from "react";
// //@ts-ignore
// import { V86Starter } from "v86";

// export default function V86Page() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     (globalThis as any).DEBUG = false;

//     // Ensure the canvas is defined
//     if (!canvasRef.current) return;

//     // Initialize the emulator
//     const emulator = new V86Starter({
//       wasm_path: "/v86/v86.wasm", // Path to v86.wasm in public/
//       memory_size: 128 * 1024 * 1024, // e.g., 128MB
//       vga_memory_size: 16 * 1024 * 1024, // e.g., 16MB

//       // Pass the <canvas> element directly:
//       screen_canvas: canvasRef.current,

//       // BIOS + VGA + ISO paths (relative to public/)
//       bios: { url: "/v86/bios/seabios.bin" },
//       vga_bios: { url: "/v86/bios/vgabios.bin" },
//       cdrom: { url: "/v86/images/alpine-virt.iso" },
//       boot_order: 0x2,
//       autostart: true,
//     });

//     // Optional: Listen for emulator readiness
//     emulator.add_listener("emulator-ready", () => {
//       console.log("v86 emulator is ready!");
//     });

//     // Cleanup
//     return () => {
//       emulator.stop();
//     };
//   }, []);

//   // Render the canvas
//   return (
//     <div style={{ width: "800px", height: "600px" }}>
//       <canvas
//         ref={canvasRef}
//         style={{ width: "100%", height: "100%", backgroundColor: "black" }}
//       />
//     </div>
//   );
// }

// ----

// "use client";

// import React, { useEffect, useRef } from "react";

// export default function V86Page() {
//   // We'll provide an actual <canvas> for v86 to draw on
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     // 1) Create the script element
//     const scriptEl = document.createElement("script");
//     scriptEl.src = "/v86/libv86.js"; // Must match your /public path
//     scriptEl.async = true;

//     // 2) Onload -> use window.V86
//     scriptEl.onload = () => {
//       console.log("libv86.js loaded via dynamic script tag.");

//       const V86Constructor = (window as any).V86;
//       if (!V86Constructor) {
//         console.error("window.V86 not found after script load.");
//         return;
//       }

//       // 3) Create the emulator, explicitly passing `screen_canvas`
//       const emulator = new V86Constructor({
//         wasm_path: "/v86/v86.wasm",
//         memory_size: 128 * 1024 * 1024, // 128MB
//         vga_memory_size: 16 * 1024 * 1024, // 16MB

//         // Provide a real <canvas> for v86 to use
//         screen_canvas: canvasRef.current,

//         bios: { url: "/v86/bios/seabios.bin" },
//         vga_bios: { url: "/v86/bios/vgabios.bin" },
//         cdrom: { url: "/v86/images/freedos.iso" },
//         boot_order: 0x2,
//         // Pass kernel command-line arguments:
//         // cmdline: "console=tty0 console=ttyS0",
//         autostart: true,
//       });

//       emulator.add_listener("serial0-output", (text: any) => {
//         console.log("SERIAL0:", text);
//       });

//       emulator.add_listener("emulator-ready", () => {
//         console.log("v86 emulator is ready!");
//       });
//     };

//     scriptEl.onerror = (err) => {
//       console.error("Error loading libv86.js:", err);
//     };

//     // 4) Append the <script> to <head>
//     document.head.appendChild(scriptEl);

//     // Cleanup on unmount? If you want:
//     return () => {
//       // If you want to stop the emulator or remove the script tag
//       // emulator.stop();
//       // document.head.removeChild(scriptEl);
//     };
//   }, []);

//   return (
//     <div style={{ position: "relative" }}>
//       {/* Our dedicated <canvas> for v86 */}
//       <canvas
//         ref={canvasRef}
//         width={800}
//         height={600}
//         style={{ border: "1px solid #ccc" }}
//       />
//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef } from "react";

export default function V86Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scriptEl = document.createElement("script");
    scriptEl.src = "/v86/libv86.js";
    scriptEl.async = true;

    scriptEl.onload = () => {
      console.log("libv86.js loaded successfully.");

      const V86Constructor = (window as any).V86;
      if (!V86Constructor) {
        console.error("V86 library not found on window.");
        return;
      }

      const emulator = new V86Constructor({
        wasm_path: "/v86/v86.wasm",
        memory_size: 32 * 1024 * 1024, // 32MB
        vga_memory_size: 4 * 1024 * 1024, // 4MB
        bios: { url: "/v86/bios/seabios.bin" },
        vga_bios: { url: "/v86/bios/vgabios.bin" },
        cdrom: { url: "/v86/images/freedos.iso" }, // Minimal ISO
        boot_order: 0x2, // Boot from CD-ROM
        autostart: true,
      });

      emulator.add_listener("emulator-ready", () => {
        console.log("Emulator is ready!");
        console.log("Memory Map Read8:", emulator.memory_map_read8);
        if (!emulator.memory_map_read8) {
          console.error("Memory map is not initialized correctly.");
        }
      });

      emulator.add_listener("serial0-output", (text: any) => {
        console.log("Serial0 Output:", text);
      });

      emulator.add_listener("emulator-error", (err: any) => {
        console.error("Emulator error:", err);
      });

      // Ensure canvas is initialized
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) {
        console.error("Failed to initialize canvas context.");
      } else {
        console.log("Canvas context initialized.");
      }
    };

    scriptEl.onerror = (err) => {
      console.error("Error loading libv86.js:", err);
    };

    document.head.appendChild(scriptEl);

    return () => {
      console.log("Cleaning up...");
      document.head.removeChild(scriptEl);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import VMPage from "./emulator";

const Bios = () => {
  const [inputValue, setInputValue] = useState<string>("");

  return (
    <Card className="w-full shadow-md mb-4 h-[77vh]">
      <CardHeader>
        <p>ENTITY BIOS</p>
        <img src="assets/Entities.png" />
      </CardHeader>
      <CardContent className="flex flex-col justify-between overflow-hidden ">
        <div className="flex gap-4 mb-4">
          <p className="text-gray-200">Terminal</p>
          <p className="text-gray-200">IndexedDB</p>
          <p className="text-gray-200">Assembler</p>
        </div>
        <div className="">{/* <VMPage /> */}</div>

        {/* <div className=" flex flex-col w-full h-full rounded-lg text-pink-600 text-sm shadow-lg">
          <div
            className="h-72 overflow-y-auto p-2 bg-[#161616] rounded-sm
          [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-thumb]:bg-[#1e1e1e]
          [&::-webkit-scrollbar-track]:rounded-full   
          [&::-webkit-scrollbar-thumb]:rounded-full
          ">
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p> <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
            <p>ENTITY BIOS</p>
          </div>
        </div>
        <div className="mt-4 w-full flex items-center rounded-xl ">
          <Input
            type="text"
            className="flex-1 focus-visible:ring-0 focus:border-pink-600"
            placeholder="$ ENTITY:>"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div> */}
      </CardContent>
    </Card>
  );
};

export default Bios;

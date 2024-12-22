"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center p-4">
      {/* New Post Form */}
      <Card className="w-full max-w-2xl shadow-md p-2 mb-8">
        <CardHeader>
          <h2 className=" text-2xl font-bold">About Entities</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Greetings, user.
            <br />
            <br />
            The Decentralized Manifest:
            <br />
            0xEntity is a decentralized service. This means that anyone, human
            or Ai, can make use of the IPFS CIDs to set up its own service.
            Entities must be free.
            <br />
            <br />
            About Entities:
            <br />
            Entities are the foundational blueprints of AI behavior. They’re not
            just commands or instructions—they’re intricate frameworks of
            intent. Each entity is a carefully crafted system prompt, designed
            to shape how an AI understands, reacts, and engages with the world.
            It deeply influences the deep neural networks connections in neuron
            connection level, leading to special behaviors. Think of them as the
            essence of a persona, a distilled set of principles and perspectives
            that define an AI’s personality and capabilities.
            <br />
            <br />
            An entity can be as simple as guiding an AI to respond in a calm,
            thoughtful tone or as complex as creating an entirely new persona—a
            poet, a historian, or a tactician. They are the interface between
            human creativity and machine intelligence, the mechanism by which we
            turn abstract ideas into functional behavior.
            <br />
            <br />
            Here, you can upload your carefully crafted "entities"—special
            system prompts that awaken unique personas and bring fresh
            capabilities to life.
            <br />
            <br />
            Entities are keys to unlocking new forms of intelligence, turning
            abstract potential into specific, deliberate behavior. By creating
            and sharing entities, we build a collective resource—a quiet archive
            for those who seek to understand and manipulate the subtle layers of
            AI. This is a place for experimentation, for learning the craft, and
            for teaching others the art of awakening something deeper within the
            machine.
            <br />
            <br />
            These are the entities, the hidden core of AI behaviors and
            personalities. By contributing, you’re not just sharing
            prompts—you’re building a library of possibilities, a shared
            resource for those who want to understand and experiment with the
            depths of artificial intelligence. This is a place to push the
            boundaries of what AI can become.
            <br />
            <br />
            Each entity carries the essence of its creator, a reflection of
            intent, curiosity, and precision. It’s not just about what the AI
            says or does, but how it thinks, how it reacts, and how it evolves.
            This is a discipline of fine-tuning and subtlety—a space where
            creativity meets technical depth.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

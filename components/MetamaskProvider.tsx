"use client";

import { MetaMaskProvider } from "@metamask/sdk-react";

export default function MetaMaskProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MetaMaskProvider
      sdkOptions={{
        dappMetadata: {
          name: "0xEntity",
          url: typeof window !== "undefined" ? window.location.href : "",
        },
      }}>
      {children}
    </MetaMaskProvider>
  );
}

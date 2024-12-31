"use client";

import { useState } from "react";
import SearchBar from "./components/SearchBar";

export default function Home() {
  const [iframeContent, setIframeContent] = useState<
    { html: string } | { url: string }
  >({ html: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (userQuery: string) => {
    try {
      setIsLoading(true);
      const rawResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userQuery }),
      });

      const response = await rawResponse.json();

      if (!rawResponse.ok) {
        throw new Error(response.error || "Failed to generate UI");
      }

      if (response.responseType === "OPEN_WEBSITE") {
        setIframeContent({ url: response.url });
      } else if (response.responseType === "TEXT") {
        setIframeContent({ html: response.html });
      }
    } catch (error) {
      console.error("Error generating UI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("iframeContent", iframeContent);

  return (
    <main className="flex flex-col items-stretch min-h-screen bg-zinc-50">
      <SearchBar onSearch={handleSearch} />
      {isLoading ? (
        <div className="flex-1">
          <div className="text-gray-500">Generating UI...</div>
        </div>
      ) : (
        <iframe
          src={'url' in iframeContent ? iframeContent.url : undefined}
          srcDoc={'html' in iframeContent ? iframeContent.html : undefined}
          className="flex-1 bg-white"
          title="Generated UI"
          sandbox="allow-scripts"
        />
      )}
    </main>
  );
}

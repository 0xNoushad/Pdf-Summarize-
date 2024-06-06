"use client";
import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function Home() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
 
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js";
    script.onload = () => {
      console.log("pdf.js loaded");
    };
    script.onerror = () => {
      console.error("Failed to load pdf.js");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target?.files?.[0]; // verify if the file is a PDF
    if (file) {
      if (file.type !== "application/pdf") {
        console.error(file.name, "is not a PDF file.");
        return;
      }

      const fileReader = new FileReader();

      fileReader.onload = function (e) {
        if (e.target && e.target.result) {
          onLoadFile(e.target.result as ArrayBuffer);
        }
      };

      fileReader.readAsArrayBuffer(file);
    }
  }

  function onLoadFile(arrayBuffer: ArrayBuffer) {
    if (!window.pdfjsLib) {
      console.error("pdfjsLib is not loaded yet.");
      return;
    }

    const typedarray = new Uint8Array(arrayBuffer);
    window.pdfjsLib
      .getDocument({
        data: typedarray,
      })
      .promise.then((pdf: any) => {
        console.log("Load pdf:", pdf.numPages);
        pdf.getPage(1).then((page: any) => {
          page.getTextContent().then((content: any) => {
            let text = "";
            content.items.forEach((item: any) => {
              text += item.str + " ";
            });
            console.log(text);
            sendToApi(text);  
          });
        });
      });
  }

  function sendToApi(text: string) {
    setIsLoading(true);
    fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.message || "Unknown error");
          });
        }

        return response.json();
      })
      .then((data) => {
        setIsLoading(false);
        if (data.summary) {
          setSummary(data.summary);
        } else {
          console.error("No summary field in response", data);
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error sending to API", error);
      });
  }

  return (
    <>
      <main
        className={`flex relative min-h-screen flex-col items-center py-12 px-12`}
      >
        <div className="top-10 left-10 absolute flex items-center gap-4">
          <span className="text-2xl"> 📄 </span>
          <span className="text-2xl"> PDF Summarizer </span>
        </div>
        <h1>Upload PDF</h1>
        <input
          className="hidden"
          type="file"
          name="file"
          id="file-input"
          accept="application/pdf"
          onChange={onFileChange}
        />

        <button
          onClick={() => {
            document.getElementById("file-input")!.click();
          }}
          className="rounded gap-4 mt-10 text-white bg-gradient-to-tr from-orange-400 to-orange-500 px-6 py-2 pointer-events-auto z-30 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-10"
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
              clipRule="evenodd"
            />
          </svg>
          <span>Upload PDF</span>
        </button>

        <div className="flex gap-5 mt-20 w-full">
          <div className="w-1/2">
            <h2 className="text-center mb-4 text-3xl text-white"> Raw Text </h2>
            <div className="text-white" id="pdfContent"></div>
          </div>
          <div className="w-1/2">
            <h2 className="text-center mb-4 text-3xl text-white">
              {" "}
              Summarized Text
            </h2>
            {isLoading && (
              <p className="text-white text-center">Wait Up Dawg</p>
            )}
            {!isLoading && <div className="text-white">{summary}</div>}
          </div>
        </div>
      </main>
    </>
  );
}

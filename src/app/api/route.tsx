import { NextResponse, NextRequest } from "next/server";
import { Client } from "@octoai/client";

 
const octoaiToken = process.env.OCTOAI_TOKEN;

 
if (!octoaiToken) {
  console.error("OCTOAI_TOKEN is not set as an environment variable.");
  throw new Error("OCTOAI_TOKEN is not set as an environment variable.");
}

const client = new Client(octoaiToken);

export const GET = async (req: NextRequest) => {
  return NextResponse.json({
    success: true,
    message: "Hello, World from GET",
  });
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const completion = await client.chat.completions.create({
      model: "nous-hermes-2-mixtral-8x7b-dpo",
      messages: [
        {
          role: "system",
          content: "Summarize the following text from PDF: " + body.text,
        },
      ],
    });

    console.log("completion:", completion.choices[0].message);

    return NextResponse.json({
      success: true,
      summary: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);

    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
};

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testData = {
      message: "API is working!",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(testData, { status: 200 });
  } catch (error) {
    console.error("Error in test API:", error);
    return NextResponse.json(
      { error: "Something went wrong with the test API" },
      { status: 500 }
    );
  }
}

import {
  DynamicRetrievalMode,
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";

enum ResponseType {
  OPEN_WEBSITE = "OPEN_WEBSITE",
  TEXT = "TEXT",
}

const ResponseTypeSchema = z.enum([ResponseType.OPEN_WEBSITE, ResponseType.TEXT]);

const generateResponseType = async (
  model: GenerativeModel,
  userQuery: string
): Promise<ResponseType> => {
  const chatSession = model.startChat({
    generationConfig: {
      maxOutputTokens: 256,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          responseType: {
            type: SchemaType.STRING,
            enum: Object.values(ResponseType),
          },
        },
        required: ["responseType"],
      },
    },
    history: [],
  });
  const result = await chatSession.sendMessage(
    `What would be the most appropriate response type for this query: "${userQuery}"? Only respond with one of: ${Object.values(
      ResponseType
    ).join(", ")}`
  );
  const response = JSON.parse(result.response.text());

  return ResponseTypeSchema.parse(response.responseType);
};

const extractUrl = (text: string) => {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

const generateWebsiteUrl = async (model: GenerativeModel, userQuery: string) => {
  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `Find a relevant website URL that would help answer this query: "${userQuery}". Respond with the URL only including https://.`
      }]
    }],
    generationConfig: {
      maxOutputTokens: 512,
    },
    tools: [{
      // @ts-ignore
      googleSearch: {},
    }]
  });

  const extractedUrl = extractUrl(result.response.text());

  return extractedUrl;
};

const generateHTML = async (model: GenerativeModel, userQuery: string) => {
  const chatSession = model.startChat({ history: [] });
  const result = await chatSession.sendMessage(
    `Generate a HTML page including CSS and JavaScript responding to this query: "${userQuery}"`
  );
  return result.response.text();
};

export async function POST(request: Request) {
  const { userQuery } = await request.json();

  if (!userQuery) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  console.log("userQuery", userQuery);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const fastModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
  const slowModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const responseType = await generateResponseType(fastModel, userQuery);

  console.log("responseType", responseType);

  if (responseType === ResponseType.OPEN_WEBSITE) {
    const url = await generateWebsiteUrl(slowModel, userQuery);
    return NextResponse.json({ responseType, url });
  } else if (responseType === ResponseType.TEXT) {
    const html = await generateHTML(slowModel, userQuery);
    return NextResponse.json({ responseType, html });
  }
  throw new Error("Invalid response type");
}

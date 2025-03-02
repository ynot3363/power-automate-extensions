import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as AdmZip from "adm-zip";
import * as mime from "mime-types";

export const extractFilesFromZipHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("Processing extractFilesFromZip request.");

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (err) {
    return { status: 400, body: "Error reading request body." };
  }

  if (!bodyText) {
    return {
      status: 400,
      body: "Please provide a ZIP file in the request body (Base64-encoded).",
    };
  }

  let zipBuffer: Buffer;
  try {
    zipBuffer = Buffer.from(bodyText, "base64");
  } catch (err) {
    return { status: 400, body: "Invalid ZIP file payload." };
  }

  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // Extract each file's name and its content (Base64-encoded)
    const files = zipEntries
      .filter((entry) => !entry.isDirectory)
      .map((entry) => {
        const entryData = entry.getData();
        // Infer the content-type from the file extension.
        const contentType =
          mime.lookup(entry.entryName) || "application/octet-stream";
        const base64 = entryData.toString("base64");

        return {
          fileName: entry.entryName,
          content: {
            "$content-type": contentType,
            $content: base64,
          },
        };
      });

    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: files }),
    };
  } catch (err: any) {
    return { status: 500, body: "Error processing ZIP file: " + err.message };
  }
};

app.http("extractFilesFromZip", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: extractFilesFromZipHandler,
});

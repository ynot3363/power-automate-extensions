import { extractFilesFromZipHandler } from "../functions/extractFilesFromZip"; // Adjust the import path as needed
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as fs from "fs";
import * as path from "path";

describe("extractFilesFromZipHandler", () => {
  let context: InvocationContext;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error when reading request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await extractFilesFromZipHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Error reading request body.");
  });

  test("returns error when request body is empty", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(""),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await extractFilesFromZipHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Please provide a ZIP file in the request body (Base64-encoded)."
    );
  });

  test("returns error when invalid ZIP file payload is provided", async () => {
    // Provide an invalid Base64 string.
    const invalidBase64 = "invalidbase64===";
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(invalidBase64),
    } as unknown as HttpRequest;

    // Expect an error during ZIP processing.
    const response: HttpResponseInit = await extractFilesFromZipHandler(
      request,
      context
    );
    expect(response.status).toBe(500);
    expect(response.body).toMatch(/Error processing ZIP file:/);
  });

  test("extracts files from a valid ZIP file", async () => {
    // Assume demo.zip.b64 exists in the same directory as this test file.
    const demoZipB64Path = path.join(__dirname, "demo.zip.b64");
    const demoZipB64 = fs.readFileSync(demoZipB64Path, "utf8");

    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(demoZipB64),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await extractFilesFromZipHandler(
      request,
      context
    );
    expect(response.headers).toEqual({ "Content-Type": "application/json" });

    const parsedBody = JSON.parse(response.body as string);
    // Verify that the "value" property is an array of file objects.
    expect(parsedBody.value).toBeDefined();
    expect(Array.isArray(parsedBody.value)).toBe(true);
    parsedBody.value.forEach((file: any) => {
      expect(file).toHaveProperty("fileName");
      expect(file).toHaveProperty("content");
      expect(file.content).toHaveProperty("$content-type");
      expect(file.content).toHaveProperty("$content");
    });
  });
});

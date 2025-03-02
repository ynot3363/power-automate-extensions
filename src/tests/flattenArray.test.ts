import { flattenArrayHandler } from "../functions/flattenArray"; // Adjust the import path as needed.
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("flattenArrayHandler", () => {
  // Create a mock context that just collects log messages.
  let context: InvocationContext;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("should return error if reading body fails", async () => {
    // Simulate a request where text() rejects
    const request: HttpRequest = {
      text: () => Promise.reject(new Error("Some error")),
    } as HttpRequest;

    const response: HttpResponseInit = await flattenArrayHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Error reading request body.");
  });

  test("should return error for invalid JSON payload", async () => {
    // Simulate a request with an invalid JSON body.
    const request: HttpRequest = {
      text: () => Promise.resolve("invalid json"),
    } as HttpRequest;

    const response: HttpResponseInit = await flattenArrayHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Invalid JSON payload.");
  });

  test("should return error if 'array' key is missing or not an array", async () => {
    // Simulate a request with a valid JSON that does not include an array.
    const request: HttpRequest = {
      text: () => Promise.resolve(JSON.stringify({ notArray: 123 })),
    } as HttpRequest;

    const response: HttpResponseInit = await flattenArrayHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Please provide an array in the request body using the key 'array'."
    );
  });

  test("should correctly flatten a nested array", async () => {
    // Simulate a valid request containing a nested array.
    const request: HttpRequest = {
      text: () =>
        Promise.resolve(JSON.stringify({ array: [1, [2, 3, [4]], 5] })),
    } as HttpRequest;

    const response: HttpResponseInit = await flattenArrayHandler(
      request,
      context
    );
    expect(response.headers).toEqual({ "Content-Type": "application/json" });
    expect(response.body).toEqual(JSON.stringify({ value: [1, 2, 3, 4, 5] }));
  });
});

import { groupArrayByHandler } from "../functions/groupArrayBy"; // Adjust the path as needed
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("groupArrayByHandler", () => {
  let context: InvocationContext;

  beforeEach(() => {
    // Create a dummy context with a jest.fn() log.
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error when reading request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await groupArrayByHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Error reading request body.");
  });

  test("returns error for invalid JSON payload", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue("invalid json"),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await groupArrayByHandler(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Invalid JSON payload.");
  });

  test("returns error when 'array' or 'key' is missing", async () => {
    // Missing the 'array' property.
    const requestMissingArray: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify({ key: "category" })),
    } as unknown as HttpRequest;

    const response1: HttpResponseInit = await groupArrayByHandler(
      requestMissingArray,
      context
    );
    expect(response1.status).toBe(400);
    expect(response1.body).toBe(
      "Please provide an array under 'array' and a grouping key under 'key' in the request body."
    );

    // Missing the 'key' property.
    const requestMissingKey: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ array: [{ category: "a" }] })),
    } as unknown as HttpRequest;

    const response2: HttpResponseInit = await groupArrayByHandler(
      requestMissingKey,
      context
    );
    expect(response2.status).toBe(400);
    expect(response2.body).toBe(
      "Please provide an array under 'array' and a grouping key under 'key' in the request body."
    );
  });

  test("groups array by provided key", async () => {
    const arrayData = [
      { category: "fruits", name: "apple" },
      { category: "fruits", name: "banana" },
      { category: "vegetables", name: "carrot" },
      { category: "fruits", name: "orange" },
    ];

    const request: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ array: arrayData, key: "category" })
        ),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await groupArrayByHandler(
      request,
      context
    );
    expect(response.headers).toEqual({ "Content-Type": "application/json" });

    const parsedBody = JSON.parse(response.body as string);
    expect(parsedBody.value).toEqual({
      fruits: [
        { category: "fruits", name: "apple" },
        { category: "fruits", name: "banana" },
        { category: "fruits", name: "orange" },
      ],
      vegetables: [{ category: "vegetables", name: "carrot" }],
    });
  });
});

import { diffArraysHandler } from "../functions/diffArrays"; // Adjust the path as needed.
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("diffArraysHandler", () => {
  let context: InvocationContext;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error when reading request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response = await diffArraysHandler(request, context);
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.error).toBe("Error reading request body.");
  });

  test("returns error for invalid JSON payload", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue("invalid json"),
    } as unknown as HttpRequest;

    const response = await diffArraysHandler(request, context);
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.error).toBe("Invalid JSON payload.");
  });

  test("returns error when arrays are missing or not arrays", async () => {
    // Case 1: Missing both array1 and array2
    const request1: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify({})),
    } as unknown as HttpRequest;

    const response1 = await diffArraysHandler(request1, context);
    expect(response1.status).toBe(400);
    let body = JSON.parse(response1.body as string);
    expect(body.error).toBe(
      "Please provide two arrays in the request body using keys 'array1' and 'array2'."
    );

    // Case 2: array1 is not an array.
    const request2: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ array1: "not an array", array2: [] })
        ),
    } as unknown as HttpRequest;

    const response2 = await diffArraysHandler(request2, context);
    expect(response2.status).toBe(400);
    body = JSON.parse(response2.body as string);
    expect(body.error).toBe(
      "Please provide two arrays in the request body using keys 'array1' and 'array2'."
    );

    // Case 3: array2 is not an array.
    const request3: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ array1: [], array2: "not an array" })
        ),
    } as unknown as HttpRequest;

    const response3 = await diffArraysHandler(request3, context);
    expect(response3.status).toBe(400);
    body = JSON.parse(response3.body as string);
    expect(body.error).toBe(
      "Please provide two arrays in the request body using keys 'array1' and 'array2'."
    );
  });

  test("returns correct diff for two arrays of primitives", async () => {
    const payload = {
      array1: [1, 2, 3, 4],
      array2: [3, 4, 5, 6],
    };

    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response = await diffArraysHandler(request, context);
    expect(response.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual({
      onlyInFirst: [1, 2],
      onlyInSecond: [5, 6],
    });
  });

  test("returns correct diff for two arrays of objects", async () => {
    const payload = {
      array1: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      array2: [
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ],
    };

    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response = await diffArraysHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual({
      onlyInFirst: [{ id: 1, name: "Alice" }],
      onlyInSecond: [{ id: 3, name: "Charlie" }],
    });
  });

  test("returns empty differences for identical arrays", async () => {
    const payload = {
      array1: [1, 2, 3],
      array2: [1, 2, 3],
    };

    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response = await diffArraysHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual({
      onlyInFirst: [],
      onlyInSecond: [],
    });
  });
});

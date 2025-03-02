import { sortArrayHandler } from "../functions/sortArray"; // Adjust the import path as needed.
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("sortArrayHandler", () => {
  let context: InvocationContext;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error when reading request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    expect(response.status).toBe(400);
    expect(response.body).toBe("Error reading request body.");
  });

  test("returns error for invalid JSON payload", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue("invalid json"),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    expect(response.status).toBe(400);
    expect(response.body).toBe("Invalid JSON payload.");
  });

  test("returns error when 'array' key is missing", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify({})),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Please provide an array in the request body using the key 'array'."
    );
  });

  test("returns error when array contains objects", async () => {
    const request: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ array: [1, { a: 2 }, 3] })),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Sorting is not supported for arrays of objects or arrays."
    );
  });

  test("sorts a numeric array with explicit numeric sort mode", async () => {
    const request: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ array: [3, 1, 2], sortMode: "numeric" })
        ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual([1, 2, 3]);
  });

  test("sorts a string array with explicit lex sort mode", async () => {
    const request: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ array: ["c", "a", "b"], sortMode: "lex" })
        ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual(["a", "b", "c"]);
  });

  test("sorts a date array with explicit date sort mode", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          array: ["2020-01-03", "2020-01-01", "2020-01-02"],
          sortMode: "date",
        })
      ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual(["2020-01-01", "2020-01-02", "2020-01-03"]);
  });

  test("auto-detects numeric sort when no sortMode is provided", async () => {
    const request: HttpRequest = {
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ array: [5, 2, 8, 1] })),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual([1, 2, 5, 8]);
  });

  test("auto-detects date sort for valid date strings", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          array: ["2021-05-01", "2021-04-01", "2021-06-01"],
        })
      ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual(["2021-04-01", "2021-05-01", "2021-06-01"]);
  });

  test("auto-detects lex sort for a string array", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          array: ["banana", "apple", "cherry"],
        })
      ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    expect(body.value).toEqual(["apple", "banana", "cherry"]);
  });

  test("falls back to lexicographical sort for mixed types", async () => {
    // In this test, we send a mixed array. The fallback converts each element to a string
    // and sorts lexicographically.
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          array: [10, "2", 3],
        })
      ),
    } as unknown as HttpRequest;

    const response = await sortArrayHandler(request, context);
    const body = JSON.parse(response.body as string);
    // Convert each element to a string to test the lexicographical order.
    const sortedAsStrings = body.value.map((item: any) => item.toString());
    expect(sortedAsStrings).toEqual(sortedAsStrings.slice().sort());
  });
});

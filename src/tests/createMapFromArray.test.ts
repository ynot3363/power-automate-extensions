import { createMapFromArray } from "../functions/createMapFromArray"; // Adjust the path as needed.
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("createMapFromArray", () => {
  let context: InvocationContext;

  beforeEach(() => {
    // Create a dummy InvocationContext with a mocked log function.
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error if request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await createMapFromArray(
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

    const response: HttpResponseInit = await createMapFromArray(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Invalid JSON payload.");
  });

  test("returns error if array is not provided", async () => {
    const payload = { property: "address.city" };
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await createMapFromArray(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Please provide an array in the request body using the key 'array'."
    );
  });

  test("returns error if property is not provided", async () => {
    const payload = { array: [{ id: "a1", address: { city: "Seattle" } }] };
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await createMapFromArray(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe(
      "Please provide a dot-separated property string in the request body using the key 'property'."
    );
  });

  test("creates map from array with nested property", async () => {
    const payload = {
      array: [
        { id: "a1", address: { city: "Seattle", zip: "98101" } },
        { id: "b2", address: { city: "Portland", zip: "97201" } },
        { id: "c3", address: { city: "Seattle", zip: "98109" } },
      ],
      property: "address.city",
    };
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await createMapFromArray(
      request,
      context
    );
    expect(response.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(response.body as string);
    expect(body.value).toBeDefined();
    // Expect two keys: "Seattle" and "Portland".
    expect(Object.keys(body.value)).toHaveLength(2);
    // For Seattle, the last one wins (object with id "c3").
    expect(body.value["Seattle"]).toEqual({
      id: "c3",
      address: { city: "Seattle", zip: "98109" },
    });
    expect(body.value["Portland"]).toEqual({
      id: "b2",
      address: { city: "Portland", zip: "97201" },
    });
  });

  test("skips items that do not have the nested property", async () => {
    const payload = {
      array: [
        { id: "a1", address: { zip: "98101" } },
        { id: "b2", address: { city: "Portland", zip: "97201" } },
      ],
      property: "address.city",
    };
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await createMapFromArray(
      request,
      context
    );
    const body = JSON.parse(response.body as string);
    // Only "Portland" should be in the map.
    expect(Object.keys(body.value)).toHaveLength(1);
    expect(body.value["Portland"]).toEqual({
      id: "b2",
      address: { city: "Portland", zip: "97201" },
    });
  });
});

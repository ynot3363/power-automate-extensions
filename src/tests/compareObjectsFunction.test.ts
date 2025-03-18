import { compareObjectsFunction } from "../functions/compareObjectsFunction"; // adjust the path if necessary
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

describe("compareObjectsFunction", () => {
  let context: InvocationContext;

  beforeEach(() => {
    // Create a dummy context with a mocked log function.
    context = { log: jest.fn() } as unknown as InvocationContext;
  });

  test("returns error when reading request body fails", async () => {
    const request: HttpRequest = {
      text: jest.fn().mockRejectedValue(new Error("read error")),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await compareObjectsFunction(
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

    const response: HttpResponseInit = await compareObjectsFunction(
      request,
      context
    );
    expect(response.status).toBe(400);
    expect(response.body).toBe("Invalid JSON payload.");
  });

  test("returns error if either obj1 or obj2 is missing", async () => {
    // Case: Missing obj2
    const payload1 = { obj1: { a: 1 } };
    const request1: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload1)),
    } as unknown as HttpRequest;
    const response1: HttpResponseInit = await compareObjectsFunction(
      request1,
      context
    );
    expect(response1.status).toBe(400);
    expect(response1.body).toBe(
      "Please provide both 'obj1' and 'obj2' in the request body."
    );

    // Case: Missing obj1
    const payload2 = { obj2: { a: 1 } };
    const request2: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload2)),
    } as unknown as HttpRequest;
    const response2: HttpResponseInit = await compareObjectsFunction(
      request2,
      context
    );
    expect(response2.status).toBe(400);
    expect(response2.body).toBe(
      "Please provide both 'obj1' and 'obj2' in the request body."
    );
  });

  test("compares objects correctly and returns differences", async () => {
    const payload = {
      obj1: {
        name: "Alice",
        age: 30,
        address: { city: "Seattle", zip: "98101" },
      },
      obj2: {
        name: "Alice",
        age: 31,
        address: { city: "Seattle", zip: "98109" },
      },
    };
    const request: HttpRequest = {
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as HttpRequest;

    const response: HttpResponseInit = await compareObjectsFunction(
      request,
      context
    );
    expect(response.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(response.body as string);
    expect(body.value).toBeDefined();

    // Expect differences in 'age' and 'address.zip'
    expect(body.value).toEqual(
      expect.arrayContaining([
        { property: "age", type: "value difference", value1: 30, value2: 31 },
        {
          property: "address.zip",
          type: "value difference",
          value1: "98101",
          value2: "98109",
        },
      ])
    );
  });
});

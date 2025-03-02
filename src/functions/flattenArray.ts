import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function flattenArrayHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Processing flattenArray request.");

  context.log("Processing flattenArray request.");

  // Read the body as text and then parse it as JSON.
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (err) {
    return { status: 400, body: "Error reading request body." };
  }

  let parsedBody: any;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch (err) {
    return { status: 400, body: "Invalid JSON payload." };
  }

  const inputArray = parsedBody.array;
  if (!Array.isArray(inputArray)) {
    return {
      status: 400,
      body: "Please provide an array in the request body using the key 'array'.",
    };
  }

  // Recursive flatten function with type annotations.
  function flatten(arr: any[]): any[] {
    return arr.reduce((acc: any[], val: any) => {
      return Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val);
    }, []);
  }

  const flattenedArray = flatten(inputArray);

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: flattenedArray }),
  };
}

app.http("flattenArray", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: flattenArrayHandler,
});

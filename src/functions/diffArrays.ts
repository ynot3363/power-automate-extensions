import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

/**
 * Deep equality function.
 * Compares two values (primitives, arrays, and plain objects) for deep equality.
 */
function isEqual(a: any, b: any): boolean {
  // Check for strict equality first.
  if (a === b) return true;

  // If types differ, they aren't equal.
  if (typeof a !== typeof b) return false;

  // Handle null, undefined, and NaN values, these are not treated as equal, no null !== undefine or NaN.
  if (
    (a === null && b === null) ||
    (a === undefined && b === undefined) ||
    (Number.isNaN(a) && Number.isNaN(b))
  )
    return true;

  if (
    a === null ||
    b === null ||
    a === undefined ||
    b === undefined ||
    Number.isNaN(a) ||
    Number.isNaN(b)
  )
    return false;

  // Compare arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // If one is an array but the other isn't, they're not equal.
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Compare objects (plain objects only)
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      // Check if both objects have the key
      if (!b.hasOwnProperty(key)) return false;
      // Recursively compare property values
      if (!isEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // For any other cases, they aren't equal.
  return false;
}

export const diffArraysHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("Processing diffArrays request.");

  // Read the request body as text
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (err) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error reading request body." }),
    };
  }

  // Parse the JSON payload
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch (err) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON payload." }),
    };
  }

  // Expecting the payload to have 'array1' and 'array2'
  const array1 = parsedBody.array1;
  const array2 = parsedBody.array2;
  if (!Array.isArray(array1) || !Array.isArray(array2)) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Please provide two arrays in the request body using keys 'array1' and 'array2'.",
      }),
    };
  }

  // Calculate the differences:
  // Items in array1 that are not deeply equal to any item in array2.
  const onlyInFirst = array1.filter(
    (item1: any) => !array2.some((item2: any) => isEqual(item1, item2))
  );
  // Items in array2 that are not deeply equal to any item in array1.
  const onlyInSecond = array2.filter(
    (item2: any) => !array1.some((item1: any) => isEqual(item1, item2))
  );

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: { onlyInFirst, onlyInSecond } }),
  };
};

app.http("diffArrays", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: diffArraysHandler,
});

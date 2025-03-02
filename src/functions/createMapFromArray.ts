import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

/**
 * Helper function to get a nested property value from an object.
 * The property path is specified as a dot-separated string.
 * For example, getNestedValue(obj, "address.city") returns obj.address.city.
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

/**
 * Azure Function: createMapFromArray
 *
 * Expects a POST request with a JSON payload containing:
 * - array: An array of objects.
 * - property: A dot-separated string representing the nested property key to use.
 *
 * The function returns a map (object) where the keys are the values extracted
 * from the nested property, and the values are the corresponding objects.
 *
 * If multiple objects share the same key, the last one in the array wins.
 */
export async function createMapFromArray(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Processing createMapFromArray request.");

  // Read the request body as text.
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (err) {
    return { status: 400, body: "Error reading request body." };
  }

  // Parse the JSON payload.
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch (err) {
    return { status: 400, body: "Invalid JSON payload." };
  }

  // Validate that an array is provided and a property name is specified.
  const array = parsedBody.array;
  const property = parsedBody.property;
  if (!Array.isArray(array)) {
    return {
      status: 400,
      body: "Please provide an array in the request body using the key 'array'.",
    };
  }
  if (!property || typeof property !== "string") {
    return {
      status: 400,
      body: "Please provide a dot-separated property string in the request body using the key 'property'.",
    };
  }

  // Create a map using the nested property as key.
  // If multiple items have the same key, the last one processed will overwrite earlier entries.
  const map: Record<string, any> = {};
  for (const item of array) {
    const keyValue = getNestedValue(item, property);
    if (keyValue !== undefined) {
      map[keyValue] = item;
    }
  }

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: map }),
  };
}

app.http("createMapFromArray", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "createMapFromArray",
  handler: createMapFromArray,
});

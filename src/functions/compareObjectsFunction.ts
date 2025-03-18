import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

/**
 * Recursively compares two objects and returns an array of difference objects.
 * @param obj1 The first object.
 * @param obj2 The second object.
 * @param path The current property path (used for nested properties).
 * @returns An array of differences.
 */
export function compareObjects(obj1: any, obj2: any, path: string = ""): any[] {
  let differences: any[] = [];

  const keys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {}),
  ]);

  for (const key of keys) {
    const fullPath = path ? `${path}.${key}` : key;
    const value1 = obj1 ? obj1[key] : undefined;
    const value2 = obj2 ? obj2[key] : undefined;

    // Check if the property exists in one object but not the other.
    if (!(key in (obj1 || {}))) {
      differences.push({
        property: fullPath,
        type: "missing in first",
        value1: undefined,
        value2,
      });
    } else if (!(key in (obj2 || {}))) {
      differences.push({
        property: fullPath,
        type: "missing in second",
        value1,
        value2: undefined,
      });
    } else {
      // If both values are objects (but not arrays), compare recursively.
      if (isObject(value1) && isObject(value2)) {
        differences = differences.concat(
          compareObjects(value1, value2, fullPath)
        );
      }
      // If both values are arrays, compare them.
      else if (Array.isArray(value1) && Array.isArray(value2)) {
        if (!arraysEqual(value1, value2)) {
          differences.push({
            property: fullPath,
            type: "array difference",
            value1,
            value2,
          });
        }
      }
      // If the values are not equal, record the difference.
      else if (value1 !== value2) {
        differences.push({
          property: fullPath,
          type: "value difference",
          value1,
          value2,
        });
      }
    }
  }

  return differences;
}

/**
 * Helper function to determine if a value is a plain object.
 */
function isObject(value: any): boolean {
  return value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Helper function to compare two arrays. Returns true if they are equal.
 * This function does a shallow comparison for non-object items and
 * a recursive comparison for objects.
 */
function arraysEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];
    if (isObject(item1) && isObject(item2)) {
      if (compareObjects(item1, item2).length > 0) return false;
    } else if (Array.isArray(item1) && Array.isArray(item2)) {
      if (!arraysEqual(item1, item2)) return false;
    } else if (item1 !== item2) {
      return false;
    }
  }
  return true;
}

/**
 * Azure Function: compareObjectsFunction
 *
 * Expects a POST request with a JSON payload containing:
 * - obj1: The first object.
 * - obj2: The second object.
 *
 * Returns a JSON object with a "differences" property containing an array
 * of differences found between the two objects.
 */
export async function compareObjectsFunction(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Processing compareObjects request.");

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

  const obj1 = parsedBody.obj1;
  const obj2 = parsedBody.obj2;

  if (!obj1 || !obj2) {
    return {
      status: 400,
      body: "Please provide both 'obj1' and 'obj2' in the request body.",
    };
  }

  const differences = compareObjects(obj1, obj2);

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: differences }),
  };
}

app.http("compareObjects", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "compareObjects",
  handler: compareObjectsFunction,
});

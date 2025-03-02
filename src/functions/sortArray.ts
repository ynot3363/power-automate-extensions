import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function sortArrayHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Processing sortArray request.");

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

  const arrayToSort: any = parsedBody.array;
  const sortMode: string | undefined = parsedBody.sortMode; // Optional: "numeric", "lex", or "date"
  if (!Array.isArray(arrayToSort)) {
    return {
      status: 400,
      body: "Please provide an array in the request body using the key 'array'.",
    };
  }

  // Check for arrays of objects or arrays.
  if (
    arrayToSort.some((item: any) => typeof item === "object" && item !== null)
  ) {
    return {
      status: 400,
      body: "Sorting is not supported for arrays of objects or arrays.",
    };
  }

  let sortedArray: any[];

  // Explicit sort mode provided?
  if (sortMode === "numeric") {
    sortedArray = arrayToSort.slice().sort((a: number, b: number) => a - b);
  } else if (sortMode === "lex") {
    sortedArray = arrayToSort.slice().sort();
  } else if (sortMode === "date") {
    sortedArray = arrayToSort
      .slice()
      .sort(
        (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()
      );
  } else {
    // Auto-detect sort method.
    if (arrayToSort.every((item: any) => typeof item === "number")) {
      sortedArray = arrayToSort.slice().sort((a: number, b: number) => a - b);
    } else if (
      arrayToSort.every(
        (item: any) => typeof item === "string" && !isNaN(Date.parse(item))
      )
    ) {
      // All elements are valid date strings.
      sortedArray = arrayToSort
        .slice()
        .sort(
          (a: string, b: string) =>
            new Date(a).getTime() - new Date(b).getTime()
        );
    } else if (arrayToSort.every((item: any) => typeof item === "string")) {
      sortedArray = arrayToSort.slice().sort();
    } else {
      // For mixed or complex types, fall back to lexicographical sort by converting to strings.
      sortedArray = arrayToSort.slice().sort((a: any, b: any) => {
        const aStr = a.toString();
        const bStr = b.toString();
        if (aStr < bStr) return -1;
        if (aStr > bStr) return 1;
        return 0;
      });
    }
  }

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: sortedArray }),
  };
}

app.http("sortArray", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: sortArrayHandler,
});

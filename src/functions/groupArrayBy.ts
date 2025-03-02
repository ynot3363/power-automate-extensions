import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export const groupArrayByHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  context.log("Processing groupArrayBy request.");

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

  const arrayToGroup: any = parsedBody.array;
  const key: string = parsedBody.key;
  if (!Array.isArray(arrayToGroup) || !key) {
    return {
      status: 400,
      body: "Please provide an array under 'array' and a grouping key under 'key' in the request body.",
    };
  }

  // Group by the specified key.
  function groupBy(arr: any[], key: string): Record<string, any[]> {
    return arr.reduce((result: Record<string, any[]>, item: any) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  const groupedResult = groupBy(arrayToGroup, key);

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: groupedResult }),
  };
};

app.http("groupArrayBy", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: groupArrayByHandler,
});

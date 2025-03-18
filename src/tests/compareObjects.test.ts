import { compareObjects } from "../functions/compareObjectsFunction"; // Adjust the path as needed

describe("compareObjects", () => {
  test("returns no differences for identical objects", () => {
    const a = { a: 1, b: "test" };
    const b = { a: 1, b: "test" };
    expect(compareObjects(a, b)).toEqual([]);
  });

  test("returns a value difference for different simple properties", () => {
    const a = { a: 1, b: "test" };
    const b = { a: 2, b: "test" };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([
      { property: "a", type: "value difference", value1: 1, value2: 2 },
    ]);
  });

  test("returns a missing in second difference when a property is missing in the second object", () => {
    const a = { a: 1, b: "test" };
    const b = { a: 1 };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([
      {
        property: "b",
        type: "missing in second",
        value1: "test",
        value2: undefined,
      },
    ]);
  });

  test("returns a missing in first difference when a property is missing in the first object", () => {
    const a = { a: 1 };
    const b = { a: 1, b: "test" };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([
      {
        property: "b",
        type: "missing in first",
        value1: undefined,
        value2: "test",
      },
    ]);
  });

  test("compares nested objects correctly", () => {
    const a = { a: { x: 1, y: 2 } };
    const b = { a: { x: 1, y: 3 } };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([
      { property: "a.y", type: "value difference", value1: 2, value2: 3 },
    ]);
  });

  test("detects array differences when arrays are different", () => {
    const a = { arr: [1, 2, 3] };
    const b = { arr: [1, 2, 4] };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([
      {
        property: "arr",
        type: "array difference",
        value1: [1, 2, 3],
        value2: [1, 2, 4],
      },
    ]);
  });

  test("returns no differences for identical arrays", () => {
    const a = { arr: [1, 2, 3] };
    const b = { arr: [1, 2, 3] };
    const differences = compareObjects(a, b);
    expect(differences).toEqual([]);
  });
});

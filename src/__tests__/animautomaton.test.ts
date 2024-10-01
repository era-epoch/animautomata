import { initDocument } from "../testing";

test("empty constructor throws error", () => {
  const initializer = () => {
    // @ts-expect-error
    new Animautomaton();
  };
  expect(initializer).toThrow(Error);
});

test("abstract Animautomaton parent class should not be initializable", () => {
  initDocument();
  const initializer = () => {
    // @ts-expect-error
    new Animautomaton("canvas");
  };
  expect(initializer).toThrow(Error);
});

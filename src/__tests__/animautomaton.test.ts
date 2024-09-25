test("Abstract Animautomaton parent class should not be initializable", () => {
  const initializer = () => {
    // @ts-expect-error
    const a = new Animautomaton();
  };
  expect(initializer).toThrow(Error);
});

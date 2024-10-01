// @ts-check
import td, { Context, Converter, ParameterType } from "typedoc";
/** @param {td.Application} app */

export function load(app: td.Application) {
  app.options.addDeclaration({
    name: "icon",
    help: "Uses --icon image-path.png as documentation image",
    type: ParameterType.String, // The default
    defaultValue: "icon.png", // The default
  });

  app.converter.on(Converter.EVENT_RESOLVE, (context: Context) => {
    if (app.options.getValue("icon")) {
      // ...
    }
  });
}

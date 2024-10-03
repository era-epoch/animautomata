import { Antiquum, Lemniscate, Sempiternal } from "./src";

try {
  new Antiquum("");
  new Lemniscate("");
  new Sempiternal("");
} catch (e) {
  console.log("If you know a better way to not do this please let me know");
}

// Not sure this is the best way to get vite to actually output the source code to ./dist
// But it works?

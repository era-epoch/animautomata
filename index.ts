import { Antiquum, Lemniscate, Sempiternal } from "./src";

// Not sure if this is the ideal way to do this?
console.log("Loading animautomata library.");
// @ts-expect-error
window.Antiquum = Antiquum;
// @ts-expect-error
window.Lemniscate = Lemniscate;
// @ts-expect-error
window.Sempiternal = Sempiternal;

import { cache } from "react";
import { currentRelease as readCurrentRelease } from "./metadata";

/** Keep the root metadata and footer on one identity during the same HTML render. */
export const currentRelease = cache(readCurrentRelease);

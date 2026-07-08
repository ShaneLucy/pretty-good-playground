import type { Chapter } from "$lib/shared/types";
import chapter1 from "./chapter-1";
import chapter2 from "./chapter-2";
import chapter3 from "./chapter-3";
import chapter4 from "./chapter-4";
import chapter5 from "./chapter-5";

export const chapters: readonly Chapter[] = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5
] satisfies readonly Chapter[];

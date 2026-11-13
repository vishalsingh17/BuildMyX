/** Published Zensical pages, also used by Next's static-file routing and sitemap. */
export const pythonLearningPaths = [
  "/learn/python/",
  "/learn/python/getting-started/",
  "/learn/python/values-and-strings/",
  "/learn/python/collections/",
  "/learn/python/control-flow-and-functions/",
  "/learn/python/scope-and-closures/",
  "/learn/python/type-hints/",
  "/learn/python/lambdas/",
  "/learn/python/iterators-and-generators/",
  "/learn/python/decorators/",
  "/learn/python/files/",
  "/learn/python/classes/",
  "/learn/python/data-model/",
  "/learn/python/exceptions/",
  "/learn/python/modules-and-packages/",
  "/learn/python/builtins/",
  "/learn/python/coverage/",
] as const;

export const learningPaths = [
  "/learn/",
  ...pythonLearningPaths,
  "/learn/system-design/",
  "/learn/fundamentals/what-is-system-design-interview/",
  "/learn/fundamentals/requirements/",
  "/learn/fundamentals/capacity-estimation/",
  "/learn/fundamentals/api-design/",
  "/learn/fundamentals/data-and-scaling/",
  "/learn/practice/design-a-link-shortener/",
] as const;

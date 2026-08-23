function joinPath(basePath: string, childPath: string): string {
  if (childPath === "") return basePath;
  return `${basePath.replace(/\/+$/, "")}/${childPath.replace(/^\/+/, "")}`;
}

function splitPathAndQuery(pathAndQuery: string): [string, string] {
  const queryIndex = pathAndQuery.indexOf("?");
  return queryIndex === -1
    ? [pathAndQuery, ""]
    : [pathAndQuery.slice(0, queryIndex), pathAndQuery.slice(queryIndex + 1)];
}

export function buildRestUrl(baseUrl: string, pathAndQuery: string): string {
  const url = new URL(baseUrl);
  const [path, query] = splitPathAndQuery(pathAndQuery);
  const restRoute = url.searchParams.get("rest_route");

  if (restRoute === null) {
    url.pathname = joinPath(url.pathname, path);
  } else {
    url.searchParams.set("rest_route", joinPath(restRoute, path));
  }

  new URLSearchParams(query).forEach((parameterValue, parameterName) => {
    url.searchParams.append(parameterName, parameterValue);
  });

  return url.toString();
}

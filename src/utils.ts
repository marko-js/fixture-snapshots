import path from "path";

export function getArcFlag(filename: string) {
  const start = filename.lastIndexOf(path.sep) + 1;
  const leftDot = filename.indexOf(".", start);

  const closeBracket = leftDot - 1;
  if (filename[closeBracket] === "]") {
    const openBracket = filename.lastIndexOf("[", closeBracket);
    if (openBracket > start) {
      // If we match a "]" before the extension and find a "[" before that,
      // then we have an arc flag. Strip it off.
      return (
        filename.slice(openBracket, closeBracket + 1)
      );
    }
  }

  return '';
}


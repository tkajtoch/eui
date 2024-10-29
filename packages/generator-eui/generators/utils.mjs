export function makeComponentName(str, usePrefix = true) {
  const words = str.split('_');

  const componentName = words.map(function(word) {
    return upperCaseFirstLetter(word);
  }).join('');

  return `${usePrefix ? 'Eui' : ''}${componentName}`;
}

export function lowerCaseFirstLetter(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toLowerCase() + txt.substr(1);
  });
}

export function upperCaseFirstLetter(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1);
  });
}

export function addDirectoryToPath(path, dirName, shouldMakeDirectory) {
  if (shouldMakeDirectory) {
    return path + '/' + dirName;
  }
  return path;
}

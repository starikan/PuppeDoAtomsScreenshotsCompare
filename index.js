const path = require('path');

const ATOMS_PATHS = ['./dist'];

const resolvedPaths = ATOMS_PATHS.map((v) => path.resolve(__dirname, v));

for (let path of resolvedPaths) {
  if (!process.env.PPD_ROOT_ADDITIONAL) {
    process.env.PPD_ROOT_ADDITIONAL = path;
  } else if (!process.env.PPD_ROOT_ADDITIONAL.includes(path)) {
    process.env.PPD_ROOT_ADDITIONAL += ',' + path;
  }
}

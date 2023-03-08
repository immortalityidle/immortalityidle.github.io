declare let require: (path: string) => { version: string };
export const environment = {
  appVersion: require('../../package.json').version,
  production: true,
};

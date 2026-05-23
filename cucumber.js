module.exports = {
  default: {
    paths: ['features/feature/**/*.feature'],
    require: ['hooks/**/*.ts', 'features/stepDef/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    }
  }
};

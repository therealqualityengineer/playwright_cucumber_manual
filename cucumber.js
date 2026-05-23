module.exports = {
  default: {
    paths: ['features/feature/**/*.feature'],
    require: ['features/stepDef/**/*.ts'],
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

module.exports = {
  default: {

    paths: ['features/feature/**/*.feature'],

    require: [
      'hooks/**/*.ts',
      'features/stepDef/**/*.ts'
    ],

    requireModule: ['ts-node/register'],

    parallel: 2,

    retry: 1,

    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'allure-cucumberjs/reporter'
    ],

    formatOptions: {
      snippetInterface: 'async-await'
    }
  }
};
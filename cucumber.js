module.exports = {
  default: {

    paths: ['features/feature/**/*.feature'],

    require: [
      'hooks/**/*.ts',
      'features/stepDef/**/*.ts'
    ],

    requireModule: ['ts-node/register'],

    parallel: 0,

    retry: 0,

    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'allure-cucumberjs/reporter:reports/allure-stream.txt'
    ],

    formatOptions: {
      snippetInterface: 'async-await'
    }
  }
};
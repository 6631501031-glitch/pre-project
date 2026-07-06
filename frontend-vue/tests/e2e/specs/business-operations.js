const { bootstrapAuthenticatedRoute } = require('../support/graduationsystemusingfacerecognition-session')

module.exports = {
  'GRADUATION SYSTEM USING FACE RECOGNITION GRADUATION SYSTEM USING FACE RECOGNITION Operations page renders system operating dashboard': function (browser) {
    const devServer = process.env.VUE_DEV_SERVER_URL
    const expectedHeading = 'GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION Operating Desk'

    browser
      .url(`${devServer}pages/login`)
      .waitForElementVisible('body', 5000)
    bootstrapAuthenticatedRoute(browser, {
      route: '/operations/business',
      permissions: {
        '/operations/business': { all: true, view: true, edit: true, action: true, delete: true }
      }
    })
    browser
      .waitForElementVisible('.business-ops-page', 20000)
      .assert.containsText('.business-ops-page h1', expectedHeading)
      .assert.elementPresent('.ops-metric')
      .assert.elementPresent('.ops-stream-tab')
      .assert.elementPresent('.ops-table')
      .assert.elementPresent('.ops-timeline__item')
      .click('.ops-stream-tab:nth-child(2)')
      .assert.elementPresent('.ops-stream-tab.is-active')
      .end()
  }
}

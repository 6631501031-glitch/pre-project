import 'core-js/stable'
import '@/assets/fonts/noto-sans-thai/font.css'
import Vue from 'vue'
import CoreuiVuePro from '@coreui/vue-pro'
import App from './App'
import router from './router/index'
import { iconsSet as icons } from './assets/icons/icons.js'
import i18n from './i18n.js'
import store from '@/store/store'

import { CIcon } from '@coreui/icons-vue'
import '@coreui/icons/css/all.min.css'
import '@/projects/styles/global.scss'

import OtpInput from '@bachdgvn/vue-otp-input'
import moment from 'moment'

Vue.component('CIcon', CIcon)
Vue.component('v-otp-input', OtpInput)

Vue.use(CoreuiVuePro)

Vue.prototype.$log = console.log.bind(console)
Vue.prototype.moment = moment

new Vue({
  el: '#app',
  router,
  store,
  icons,
  i18n,
  template: '<App/>',
  components: {
    App
  }
})
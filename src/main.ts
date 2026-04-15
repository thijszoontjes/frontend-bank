import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { pinia } from './stores/index'
import './styles/tokens.css'
import './styles/base.css'

const app = createApp(App)

app.use(pinia)

const authStore = useAuthStore(pinia)
await authStore.hydrate()

app.use(router)
app.mount('#app')

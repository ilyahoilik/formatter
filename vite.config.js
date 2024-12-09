/** @type {import('vite').UserConfig} */
export default {
    base: './',
    build: {
        commonjsOptions: {
            transformMixedEsModules: true
        }
    }
}
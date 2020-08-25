const { createServer } = require('./devserver')
const { tranHtml } = require('./markdown')
const { withTitles } = require('./markdown/title')
const { createMiddleware } = require('./menu')
const path = require('path')
const ssr = require('./ssr')
const app = createServer()
const fs = require('fs')

const KoaStatic = require('koa-static')

module.exports.startDev = (options = {
    root: path.resolve('.'),
    port: 3000
}) => {
    app.use(createMiddleware(options))

    // 静态服务
    // app.use(KoaStatic('./assets'))
    app.use(async (ctx, next) => {
        // console.log('ctx.url', ctx.url)
        if (ctx.url.startsWith('/assets')) {
            try {
                const buffer = fs.readFileSync(path.resolve(__dirname, './' + ctx.url))
                ctx.type = path.extname(ctx.url).slice(1);
                ctx.body = buffer
            } catch (e) {
                ctx.body = ''
            }

        } else {
            await next()
        }
    })

    app.use(async (ctx, next) => {
        const { request: { url, query } } = ctx
        const resolvePath = filePath => path.resolve(options.root, './' + filePath)
        const markDownPath = resolvePath(path.extname(url) === '' ? url + '/README.md' : url)
        // console.log('markDownPath:', markDownPath)
        const data = {
            menu: withTitles(ctx.menu, resolvePath),
            markdown: tranHtml(markDownPath)
        }
        ctx.body = await ssr.createRender(path.resolve(__dirname, './template/App.vue'))(data)
        await next()
    })

    const port = options.port ? options.port : 3000
    app.start(port, () => {
        console.log('app start at ' + port)
    })
}





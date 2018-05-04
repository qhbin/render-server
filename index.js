const Koa = require('koa')
const KoaStatic = require('koa-static')
const router = require('koa-router')()
const c2k = require('koa2-connect')
const proxy = require('http-proxy-middleware')
const session = require('koa-session')
const config = require('./config')

const app = new Koa();

app.keys = ['some secret hurr'];
const CONFIG = {
	key: 'koa:sess', //cookie key (default is koa:sess)
	maxAge: 86400000, // cookie的过期时间 maxAge in ms (default is 1 days)
	overwrite: true, //是否可以overwrite    (默认default true)
	httpOnly: true, //cookie是否只有服务器端可以访问 httpOnly or not (default true)
	signed: true, //签名默认true
	rolling: false, //在每次请求时强行设置cookie，这将重置cookie过期时间（默认：false）
	renew: false, //(boolean) renew session when session is nearly expired,
};

app.use(session(CONFIG, app));

app.use(async (ctx, next) => {
	let {res, protocol, host, query } = ctx;
	if (query.token) ctx.session.token = query.token;
	next()
	ctx.session.token = 'ssss'
	ctx.body='ssss'
});

let map = new Map()

let getProxy = (token, protocol, host) => c2k(proxy({
	target: 'http://localhost:8080',
	changeOrigin: true,
	router: function(req) {
		debugger
		let ss = token
		return 'http://localhost:8080';
	},
	onProxyRes(proxyRes, req, res) {
		debugger
		let {
			url
		} = req
		if (url.indexOf('?') > -1 && url.indexOf('token') > 0) {
			res.writeHead(302, {
				'Location': `${protocol}://${host}`
			})
			res.end()
		}
	}
}))

/*app.use(async (ctx, next) => {
	debugger
	let {protocol, host } = ctx;
	let {token } = ctx.session
	if (!map.has(token)) {
		map.set(token, getProxy(token, protocol, host))
	}
	return map.get(token)(ctx, next)
});*/

app.listen(config.port)
console.log('render server started!')
const Koa = require('koa')
const c2k = require('koa2-connect')
const proxy = require('http-proxy-middleware')
const session = require('koa-session')
const config = require('./config')

const app = new Koa();

//session配置项
app.keys = ['koa key'];
const CONFIG = {
	key: 'koa:sess', 
	maxAge: 86400000, 
	overwrite: true,
	httpOnly: true, 
	signed: true, 
	rolling: false, 
	renew: false
};
app.use(session(CONFIG, app));


//设置token
app.use(async (ctx, next) => {
	let { query } = ctx;
	if (query.host) ctx.session.host = query.host;
	next()
});

//定义全局map存放接入的系统
let map = new Map()

//代理函数
let getProxy = (target, protocol, host) => c2k(proxy({
	target: config.BASE_PROXY,
	changeOrigin: true,
	router: function(req) {
		if(!!target){
			return target;
		}
		return config.BASE_PROXY;
	},
	onProxyRes(proxyRes, req, res) {
		let {url } = req 
		if (url.indexOf('?') > -1 && url.indexOf('host') > 0) {
			res.writeHead(302, {
				'Location': `${protocol}://${host}`
			})
			res.end()
		}
	}
}))

//代理中间件
app.use(async (ctx, next) => {
	let {protocol, host } = ctx;
	let target = null;
	if(!!ctx.session.host){
		target = ctx.session.host
	}
	if (!map.has(target)) {
		map.set(target, getProxy(target, protocol, host))
	}
	return map.get(target)(ctx, next)
});

app.listen(config.PORT)
console.log('render server started!')
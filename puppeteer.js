const puppeteer = require('puppeteer')
const fs = require('fs')


class PuppeteerRenderer {
	constructor(rendererOptions) {
		this._options = rendererOptions || {}
		this._puppeteer = null
	}

	// 初始化浏览器
	async initialize() {
		try {
			// Workaround for Linux SUID Sandbox issues.
			if (!this._options.args) this._options.args = []
			this._options.args.push('--disable-web-security')
			if (process.platform === 'linux') {
				if (this._options.args.indexOf('--no-sandbox') === -1) {
					this._options.args.push('--no-sandbox')
					this._options.args.push('--disable-setuid-sandbox')
				}
			}

			this._puppeteer = await puppeteer.launch(this._options)
		} catch (e) {
			console.error(e)
			console.error('[PuppeteerRenderer] 初始化PuppeteerRenderer失败')
			throw e
		}
		return this._puppeteer
	}

	// 处理请求拦截
	async handleRequestInterception(page, baseURL) {
		await page.setRequestInterception(true)
		page.on('request', req => {
			// 跳过api请求
			const isLocalApi = ['fetch', 'xhr', 'websocket'].indexOf(req.resourceType()) > -1 && req.url().startsWith(baseURL)
			// 跳过所有请求
			if (this._options.skipRequest && isLocalApi) {
				req.abort();
				return;
			}

			if (this._options.forceMock && Object.prototype.toString.call(this._options.forceMock) === '[object Object]' && this._options.forceMock[req.url()]) {
				req.respond({
					contentType: 'application/json; charset=utf-8',
					body: JSON.stringify(this._options.forceMock[req.url()]),
				});
				return;
			}
			if (isLocalApi) {
				// mock地址
				let apiPath = req.url().split('/');
				apiPath = '/' + apiPath.splice(3).join('/');
				if (
					this._options.mock &&
					Object.prototype.toString.call(this._options.mock) === '[object Object]' && this._options.mock[apiPath]
				) {
					req.respond({
						contentType: 'application/json; charset=utf-8',
						body: JSON.stringify(this._options.mock[apiPath])
					});
					return;
				}
			}
			req.continue()
		})
	}

	// 关闭浏览器
	close() {
		this._puppeteer.close()
	}

	// 渲染指定路径
	async renderRoutes(routes, Prerenderer) {
		const options = Prerenderer.getOptions()
		const pagePromises = Promise.all(
			routes.map(async route => {
				const page = await this._puppeteer.newPage()
				const baseURL = `http://localhost:${options.port}`
				await page.setViewport(options.renderOption ? (options.renderOption.viewport || { 'width': 1920, 'height': 1080 }) : { 'width': 1920, 'height': 1080 })
				await this.handleRequestInterception(page, baseURL)
				await page.goto(`${baseURL}${route}`, { waituntil: 'networkidle2', domcontentloaded: true, timeout: 60000000 });
				// 等待某个class
				if (options.renderOption && options.renderOption.waitForElement && typeof options.renderOption.waitForElement === 'string') {
					await page.waitForSelector(options.renderOption.waitForElement)
				}
				// sleep 1s
				await page.waitForTimeout(1000)

				const result = {
					originalRoute: route,
					route: await page.evaluate('window.location.pathname'),
					html: await page.content()
				}
				await page.close()
				return result
			})
		)

		return pagePromises
	}
}


module.exports = PuppeteerRenderer
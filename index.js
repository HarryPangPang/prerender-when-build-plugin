const path = require('path')
const fs = require('fs')
const Prerenderer = require('./prerenderer')
const PuppeteerRenderer = require('./puppeteer')

class PrerenderSPAPlugin {
	constructor(options) {
		this._options = {
			renderer: new PuppeteerRenderer(options.renderOption ? { headless: true, skipRequest: true, ...options.renderOption } : { headless: true, skipRequest: true }),
			...options,
			server: {},
		}
	}
	apply(compiler) {
		const compilerFS = compiler.outputFileSystem

		compiler.hooks.afterEmit.tapAsync('PrerenderSPAPlugin', (compilation, done) => {
			const PrerendererInstance = new Prerenderer(this._options)
			PrerendererInstance.initialize()
				.then(() => {
					return PrerendererInstance.renderRoutes((this._options.routes || ['/']))
				}).then(renderedRoutes => {
					renderedRoutes.forEach(renderedRoute => {
						renderedRoute.outputPath = path.join(path.resolve((this._options.outDir || 'dist')), renderedRoute.route)
					});
					return renderedRoutes
				}).then((renderedRoutes) => {
					return Promise.all(renderedRoutes.map(renderedRoute => new Promise((resolve, reject)=>{
						compilerFS.writeFile(renderedRoute.route === '/' ? `${renderedRoute.outputPath}${(this._options.html || 'index.html')}` : `${renderedRoute.outputPath}.html` , renderedRoute.html.trim(), err => {
							if (err) reject(err)
							else resolve()
						})
					})
					)).catch(err => {
						const msg = err.message || 'PrerenderSPAPlugin 发生错误'
						PrerendererInstance.destroy()
						compilation.errors.push(new Error(msg))
						done()
					})
				}).then(() => {
					PrerendererInstance.destroy()
					done()
				}).catch(err => {
					const msg = err.message || 'PrerenderSPAPlugin 发生错误'
					PrerendererInstance.destroy()
					compilation.errors.push(new Error(msg))
					done()
				})
		});
	}
}

PrerenderSPAPlugin.PuppeteerRenderer = PuppeteerRenderer

module.exports = PrerenderSPAPlugin

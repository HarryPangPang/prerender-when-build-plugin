const Server = require('./server')
// const PortFinder = require('portfinder')

class Prerenderer {
	constructor(options) {
		this._server = new Server(this)
		this._options = options || {}
		this._renderer = options.renderer
	}

	async initialize() {
		await this._server.initialize()
		await this._renderer.initialize()

		return Promise.resolve()
	}

	destroy() {
		this._renderer.close()
		this._server.close()
	}


	getServer() {
		return this._server
	}

	getRenderer() {
		return this._renderer
	}

	getOptions() {
		return this._options
	}

	modifyServer(server, stage) {
		if (this._renderer.modifyServer) this._renderer.modifyServer(this, server, stage)
	}

	renderRoutes(routes) {
		return this._renderer.renderRoutes(routes, this)
			.then(renderedRoutes => {
				renderedRoutes.forEach(rendered => {
					rendered.route = decodeURIComponent(rendered.route)
				})
				return renderedRoutes
			})
	}
}
module.exports = Prerenderer
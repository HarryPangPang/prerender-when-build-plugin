const express = require('express')
const path = require('path')

class Server {
  constructor (Prerenderer) {
    this._prerenderer = Prerenderer
    this._options = {}
    this._expressServer = express()
    this._nativeServer = null
  }

  initialize () {
    const server = this._expressServer
    this._options = this._prerenderer.getOptions()

    this._prerenderer.modifyServer(this, 'pre-static')

    server.get('*.*', express.static(path.resolve(this._options.outDir), {
      dotfiles: 'allow'
    }))

    this._prerenderer.modifyServer(this, 'post-static')

    this._prerenderer.modifyServer(this, 'pre-fallback')

    server.get('*', (req, res) => {
      res.sendFile( path.join(path.resolve(this._options.outDir), this._options.html || 'index.html'))
    })

    this._prerenderer.modifyServer(this, 'post-fallback')

    return new Promise((resolve, reject) => {
      this._nativeServer = server.listen(this._options.port || 1234, () => {
        resolve()
      })
    })
  }

  close () {
    this._nativeServer.close()
  }
}

module.exports = Server

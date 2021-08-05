new PrerenderSPAPlugin({
                routes: ['/', '/result'],
                outDir: 'dist',
                port: 11111,
                html: 'index.html',
                renderOption: {
                    skipRequest: false,
                    headless: true,
                    viewport: {'width':1920,'height':1080},
                    mock: {
                        "/api/sdk/pcpay/paytype": [
                            {"pay_type": 4, "name": "wechat", "is_recomanded": true},
                            {"pay_type": 3, "name": "alipay", "is_recomanded": false},
                            {"pay_type": 10, "name": "paypal", "is_recomanded": false},
                            {"pay_type": 18, "name": "worldpay-visa", "is_recomanded": false},
                            {"pay_type": 18, "name": "worldpay-master", "is_recomanded": false}        
                          ]
                    }
                },
              })
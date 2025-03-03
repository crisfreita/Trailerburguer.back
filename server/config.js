var config = {
    dev: {
        url: 'http://localhost/',
        port: 3000,
        ambiente: 'DEV', 
        database: {
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '311995',
            database: 'delivery',
            timezone: 'utc'
        },
    },
    prod: {
        url: 'http://www.trailerburguer.com.br/',
        port: 21081,
        ambiente: 'PROD', 
        database: {
            host: 'mysql.trailerburguer.com.br',
            port: 3306,
            user: 'trailerburguer',
            password: '123sistema',
            database: 'trailerburguer',
            timezone: 'utc'
        },
    }
}

exports.get = function get(ambiente) {

    if (ambiente.toLowerCase() === 'dev') {
        return config.dev
    }
    if (ambiente.toLowerCase() === 'prod') {
        return config.prod
    }

}

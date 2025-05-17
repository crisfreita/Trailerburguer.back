var config = {
    dev: {
        url: 'http://localhost/',
        port: 3000,
        ambiente: 'DEV', 
        database: {
            host: '127.0.0.1',
            port: 3306,
            user: 'USUARIO',
            password: 'SENHA',
            database: 'NOME_BANCO',
            timezone: 'utc'
        }
    },
    prod: {
        url: 'http://www.trailerburguer.com.br/',
        port: 21137,
        ambiente: 'PROD', 
        database: {
            host: '127.0.0.1',
            port: 3306,
            user: 'trailerburguer',
            password: 'trailer123',
            database: 'trailerburguer',
            timezone: 'utc'
        }
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

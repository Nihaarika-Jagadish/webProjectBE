const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output4.json'
const endpointsFiles = ['./index.js']

swaggerAutogen(outputFile, endpointsFiles)
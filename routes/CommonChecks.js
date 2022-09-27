module.exports.checkUndefinedFunction = function (query){
    var value = query.includes('undefined') || query.includes('null')
    return value
}

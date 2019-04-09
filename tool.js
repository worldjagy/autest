var tool = {};
load = function (url,v) {
    var fileName = url.substring(url.lastIndexOf('/')+1);
    var sdPath = files.getSdcardPath()
    var libdir = files.join(sdPath, "/slib/")
    var path = files.join(libdir, fileName+(v?v:''))
    files.ensureDir(path)
    var r = files.exists(path)
    if (r) {
        return path;
    }
    files.listDir(libdir, function(name){
        if(name.startsWith(fileName)){
            return files.remove(libdir+'/'+name)
        }
        return false
    })
    r = http.get(url);
    files.writeBytes(path, r.body.bytes())
    return path;
}
tool.loadDex =function(url,v){
    loadDex(load(url,v));
}
tool.loadJar =function(url,v){
    loadJar(load(url,v));
}
tool.require = function(url,v){
    return require(load(url,v));
}

module.exports = tool;

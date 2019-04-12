var _ = require('lodash')
var tool = {};
var sgs = storages.create("app");
tool.getUrl = function(path){
    return sgs.get('baseUrl')+path;
}
tool.load = function (path, v) {
    var fileName = path.substring(path.lastIndexOf('/') + 1);
    var sdPath = files.getSdcardPath()
    var libdir = files.join(sdPath, "/slib/")
    var lpath = files.join(libdir, fileName + (v ? v : ''))
    files.ensureDir(lpath)
    var r = files.exists(lpath)
    if (r) {
        return lpath;
    }
    files.listDir(libdir, function (name) {
        if (name.startsWith(fileName)) {
            return files.remove(libdir + '/' + name)
        }
        return false
    })
    r = http.get(this.getUrl(path));
    files.writeBytes(lpath, r.body.bytes())
    return lpath;
}
tool.loadDex = function (path, v) {
    loadDex(this.load(path, v));
}
tool.loadJar = function (path, v) {
    loadJar(this.load(path, v));
}
tool.require = function (path, v) {
    return require(this.load(path, v));
}
tool.execScriptFile = function (path, v) {
    engines.execScriptFile(this.load(path, v))
}
tool.execScript = function (path) {
    r = http.get(this.getUrl(path));
    var fileName = path.substring(0,path.lastIndexOf('.'));
    engines.execScript(fileName, r.body.string())
}
tool.eval = function (path, v) {
    try {
        var scripts = sgs.get('scripts', []);
        var script = _.find(scripts,{path:path})
        var cnt = '';
        if(script){
            if(script.version == v){
                cnt = script.content;
                eval(cnt)
                return;
            }
        }
        r = http.get(this.getUrl(path));
        cnt = r.body.string();
        if(script){
            _.assignIn(script, {content:cnt,version:v})
        }else{
            scripts.push({content:cnt,path:path,version:v})
        }
        sgs.put('scripts',scripts);
        eval(cnt);
    } catch (e) {
        log(e)
    }
}

module.exports = tool;

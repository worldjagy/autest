var _ = require('lodash')
var tool = {};
importClass(java.text.SimpleDateFormat);
importClass(android.util.Base64)
var sdf = new SimpleDateFormat("yyyy-MM-dd");
var nsdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
var tsdf = new SimpleDateFormat("HH:mm");
tool.today = function () {
    return sdf.format(new Date());
}
tool.now = function () {
    return nsdf.format(new Date());
}
tool.time = function (date) {
    return tsdf.format(date || new Date());
}
tool.uuid = function () {
    return java.util.UUID.randomUUID().toString().replace(/-/g, "");
}
tool.b64 = function (str) {
    return java.lang.String(Base64.decode(java.lang.String(str).getBytes(), 0));
}
tool.e64 = function (str) {
    return Base64.encodeToString(java.lang.String(str).getBytes(), 2);
}
tool.md5 = function (string) {
    return java.math.BigInteger(1, java.security.MessageDigest.getInstance("MD5")
        .digest(java.lang.String(string).getBytes())).toString(16);
}
var sgs = storages.create("app");
tool.getUrl = function (path) {
    if (path.startsWith('http:') || path.startsWith('https:')) {
        return path;
    }
    return sgs.get('baseUrl') + path;
}
tool.setBaseUrl = function (url) {
    sgs.put('baseUrl', url)
}
tool.load = function (path, v, f) {
    var fileName = path.substring(path.lastIndexOf('/') + 1);
    var lpath = fileName + (v ? v : '');
    var r = files.exists(lpath)
    if (r && !f) {
        return lpath;
    }
    files.listDir(files.cwd(), function (name) {
        if (name.startsWith(fileName)) {
            return files.remove(name)
        }
        return false
    })
    r = http.get(this.getUrl(path));
    if(r.statusCode == 200){
        files.writeBytes(lpath, r.body.bytes())
    }
    return lpath;
}
tool.loadDex = function (path, v, f) {
    loadDex(this.load(path, v, f));
}
tool.loadJar = function (path, v, f) {
    loadJar(this.load(path, v, f));
}
tool.execScriptFile = function (path, v, f) {
    engines.execScriptFile(this.load(path, v, f))
}
tool.execScript = function (path) {
    r = http.get(this.getUrl(path));
    var fileName = path.substring(0, path.lastIndexOf('.'));
    engines.execScript(fileName, r.body.string())
}
tool.getContent = function (path) {
    r = http.get(this.getUrl(path)); 
    return r.body.string();
}
tool.require2 = function (path) {
    fileName = this.uuid()
    try {
        r = http.get(this.getUrl(path));
        files.write(fileName, r.body.string())
        return require(fileName)
    } catch (e) { log(e) }finally{
        files.remove(fileName)
    }
}
tool.setScript = function(s){
    var scripts = sgs.get('scripts', []);
    var script = _.find(scripts, { id: s.id })
    script? _.assignIn(script, s):scripts.push(s)
    sgs.put('scripts', scripts);
}
tool.getScript = function(s){
    var scripts = sgs.get('scripts', []);
    return _.find(scripts, { id: s.id })
}
tool.require = function (path) {
    var scripts = sgs.get('scripts', []);
    var script = _.find(scripts, { path: path })
    if(!script){
        log('not found the moudle',path);
        return {};
    }
    fileName = this.uuid()
    try {
        files.write(fileName, this.b64(script.content))
        return require(fileName)
    } catch (e) { log(e) }finally{
        files.remove(fileName)
    }
}

module.exports = tool;

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
    if(path.startsWith('http:')||path.startsWith('https:')){
        return path;
    }
    return sgs.get('baseUrl') + path;
}
tool.setBaseUrl = function(url){
    sgs.put('baseUrl',url)
}
tool.load = function (path, v, f) {
    var fileName = path.substring(path.lastIndexOf('/') + 1);
    var sdPath = files.getSdcardPath()
    var libdir = files.join(sdPath, "/slib/")
    var lpath = files.join(libdir, fileName + (v ? v : ''))
    files.ensureDir(lpath)
    var r = files.exists(lpath)
    if (r&&!f) {
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
tool.loadDex = function (path, v, f) {
    loadDex(this.load(path, v, f));
}
tool.loadJar = function (path, v, f) {
    loadJar(this.load(path, v, f));
}
tool.require = function (path, v, f) {
    return require(this.load(path, v, f));
}
tool.execScriptFile = function (path, v, f) {
    engines.execScriptFile(this.load(path, v, f))
}
tool.execScript = function (path) {
    r = http.get(this.getUrl(path));
    var fileName = path.substring(0, path.lastIndexOf('.'));
    engines.execScript(fileName, r.body.string())
}
tool.getContent = function (path, v, f) {
    try {
        var scripts = sgs.get('scripts', []);
        var script = _.find(scripts, { path: path })
        var cnt = '';
        if (script&&!f) {
            if (script.version == v) {
                cnt = script.content;
                return cnt;
            }
        }
        r = http.get(this.getUrl(path));
        cnt = r.body.string();
        if (script) {
            _.assignIn(script, { content: cnt, version: v })
        } else {
            scripts.push({ content: cnt, path: path, version: v })
        }
        sgs.put('scripts', scripts);
        return cnt;
    } catch (e) {
        log(e)
    }
}

module.exports = tool;

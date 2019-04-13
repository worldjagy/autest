var _ = require('lodash');
var _scriptName = engines.myEngine().getSource().toString();
var _appName=null;
var _isStopCloseApp = true;
var _exists = false;
var _package = null;
var beginTime = new Date();
//device.setBrightnessMode(0);
//device.setBrightness(0);
importClass(java.text.SimpleDateFormat);
var sdf = new SimpleDateFormat("yyyy-MM-dd");
var nsdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
var host = 'sqsm.mayfool.net:8088'
var _utils = {
    today: function () {
        return sdf.format(beginTime);
    },
    now: function () {
        return nsdf.format(new Date());
    },
    uuid: function () {
        return java.util.UUID.randomUUID().toString().replace(/-/g, "");
    }
}

var T = function () {
    var sgs = storages.create("sqsm-tm");
    var today = _utils.today();
    var t_key = 'task_' + today;
    var statistics_key = 'task_statistics_' + today;
    var app_stati_key = 'task_app_'+today;
    var _uuid = _utils.uuid();
    var args = engines.myEngine().execArgv;
    var execTime = random((args.minExec||20)*60000,(args.maxExec||30)*60000);
    var endTime = beginTime.getTime()+execTime;
    return {
        setState: function (o) {
            o.uuid = _uuid;
            o.name = _scriptName;
            o.appName = _appName;
            var ts = sgs.get(t_key, []);
            var old = _.find(ts, { uuid: _uuid });
            old ? _.assignIn(old, o) : ts.push(o);
            sgs.put(t_key, ts);
        },
        getState: function(attr){
            var ts = sgs.get(t_key,[]);
            var old = _.find(ts, { uuid: _uuid });
            return old && old[attr];
        },
        updateStatistics: function () {
            var ts = sgs.get(statistics_key,[]);
            var old = _.find(ts, { name: _scriptName });
            var now = _utils.now();
            if (old) {
                old.count += 1;
                old.exitTime = now;
            } else {
                ts.push({ name: _scriptName, count: 1, exitTime: now })
            }
            sgs.put(statistics_key, ts);
        },
        setAppState: function(o) {
            var ts = sgs.get(app_stati_key,[]);
            var old = _.find(ts, { appName: _appName });
            o.lastOpTime = new Date().getTime()
            if(old){ _.assignIn(old, o) }else{
                o.id = _utils.uuid();
                o.appName = _appName;
                o.cdate = today;
                o.imei = device.getIMEI();
                o.signIn = '0';
                o.totalIncome = 0;
                o.dailyIncome=0;
                o.takeTime = 0;
                ts.push(o)
            }
            sgs.put(app_stati_key, ts);
        },
        getAppState: function (attr) {
            var old = this.getAppLog();
            return old && old[attr];
        },
        getAppLog:function(){
            var ts = sgs.get(app_stati_key,[]);
            return _.find(ts, { appName: _appName });
        },
        postAppLog:function(){
            lastOpTime = this.getAppState('lastOpTime');
            postTime = this.getAppState('postTime');
            if(lastOpTime<=postTime){ return; }
            r = http.postJson(host+'/log/appLog',this.getAppLog())
            if(r.statusCode==200){
                if(JSON.parse(r.body.string()).code==0)
                    this.setAppState({postTime:new Date().getTime()})
            }
        },
        getExecTime:function(){
            return execTime;
        },
        isTimeUp:function(){
            var mtp= endTime-new Date().getTime()
            log('Rest of time:%d miniutes', mtp/60000)
            return mtp<0;
        }
    }
}();

_log = log
log = function() {
    try {
        var t = util.format.apply(util, arguments)
        var logs = T.getState('logs') || [];
        logs.push(_utils.now() + ":" + t)
        T.setState({ logs: logs });
        _log(t)
    } catch (e) {
    }
}
log('exec time ==> %f',T.getExecTime()/60000)

function stopApp() {
    let forcedStopStr = ["停", "强", "结束"];
    let p = app.getPackageName(_appName);
    log('stopping app:' + p)
    if (p) {
        app.openAppSetting(p);
        text(_appName).findOne(6000);
        for (var i = 0; i < forcedStopStr.length; i++) {
            if (textContains(forcedStopStr[i]).exists()) {
                let forcedStop = textContains(forcedStopStr[i]).findOne(3000);
                if (forcedStop.enabled()) {
                    forcedStop.click();
                    if (t = text("确定").findOne(3000)) {
                        t.click();
                    }
                    log(_appName + " completed exit!");
                    sleep(500); back(); break;
                } else {
                    back();
                    log(_appName + " not running in background！");
                }
            }
        }
    } else {
        log(_appName + ' app not exists!');
    }
}

//开始
T.setState({ beginTime: _utils.now() });
_launchApp=launchApp
launchApp = function (app, flag) {
    _appName = app;
    _package = getPackageName(app)
    log(_package)
    isStopCloseApp = flag
    _exists = _launchApp(_appName);
    if (!_exists) {
        log('Not install App ' + _appName)
        exit();
    }
}
// 结束
events.on('exit', function () {
    T.setState({ exitTime: _utils.now() });
    //耗时
    var takeTime = parseInt((new Date()-beginTime)/1000);
    log('take time: '+takeTime+'s')
    T.setState({takeTime:takeTime});
    if (!_exists) { return; }
    if(_appName){
        var oldTime = T.getAppState('takeTime')
        totalTime = takeTime+oldTime;
        T.setAppState({takeTime:totalTime})
        T.postAppLog();
    }
    T.updateStatistics();
    if (_isStopCloseApp || _isStopCloseApp == undefined) {
        stopApp();
    }
});
module.exports = T;

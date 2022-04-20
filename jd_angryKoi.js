/*
愤怒的锦鲤
更新时间：2022-04-13
备注：高速并发请求，专治偷助力。在kois环境变量中填入需要助力的pt_pin，有多个请用@符号连接

作者：LingFeng魔改版

需要安装依赖：
pnpm install -g global-agent
pnpm install -g bootstrap

改用以下变量
#雨露均沾，若配置，则车头外的ck随机顺序，这样可以等概率的随到前面来
export  KOI_FAIR_MODE="true"
#其他变量
export kois ="pt_pin@pt_pin@pt_pin" 指定车头pin
export PROXY_URL ="" ip代理api
export Rabbit_Url =""
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#愤怒的锦鲤
30 0,8 * * * jd_angryKoi_log.js, tag=愤怒的锦鲤, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=================================Loon===================================
[Script]
cron "30 0,8  * * *" script-path=jd_angryKoi_log.js,tag=愤怒的锦鲤
===================================Surge================================
愤怒的锦鲤 = type=cron,cronexp="30 0,8  * * *",wake-system=1,timeout=3600,script-path=jd_angryKoi_log.js
====================================小火箭=============================
愤怒的锦鲤 = type=cron,script-path=jd_angryKoi_log.js, cronexpr="30 0,8  * * *", timeout=3600, enable=true
 */
const $ = new Env("愤怒的锦鲤-LOG版 ")
require("global-agent/bootstrap");
const JD_API_HOST = 'https://api.m.jd.com/client.action';
const ua = "Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1"
let fair_mode = process.env.KOI_FAIR_MODE == "true" ? true : false
let chetou_number = process.env.KOI_CHETOU_NUMBER ? Number(process.env.KOI_CHETOU_NUMBER) : 0
var kois = process.env.kois ?? ""
let proxyUrl = process.env.PROXY_URL ?? ""; // 代理的api地址
let proxy = "";
let RabbitUrl = process.env.Rabbit_Url ?? ""; // logurl
let jdlogurl = process.env.Jdlog_Url ?? ""; // logurl
let nums = 0;
let cookiesArr = []
let scriptsLogArr = []
var tools = []
if (proxyUrl){
    let urlRex =
        /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/g;
    global.GLOBAL_AGENT.NO_PROXY = `${urlRex.exec(proxyUrl)[0]},log.catttt.com`;
}
if (!jdlogurl && !RabbitUrl){
    console.log(`请填写普通获取的logurl,变量是Jdlog_Url 或者填写Rabbit获取的logurl，变量是Rabbit_Url`)
    return;
}
var logs;

let notify, allMessage = '';

!(async () => {
    await requireConfig()
    console.log(`\n 示例: logs 值 "random":"75831714","log":"1646396568418~1jD94......太长省略...Qwt9i"\n`)
    console.log(`当前配置的车头数目：${chetou_number}，是否开启公平模式：${fair_mode}`)
    console.log("开始获取用于助力的账号列表")
    for (let i in cookiesArr) {
        // 将用于助力的账号加入列表
        tools.push({id: i, assisted: false, cookie: cookiesArr[i]})
    }
    console.log(`用于助力的数目为 ${tools.length}`)
    allMessage += `用于助力的数目为 ${tools.length}\n`

    console.log(`根据配置，计算互助顺序`)
    let cookieIndexOrder = []
    if (fair_mode) {
        // 若开启了互助模式，则车头固定在前面
        for (let i = 0; i < chetou_number; i++) {
            cookieIndexOrder.push(i)
        }
        // 后面的随机顺序
        let otherIndexes = []
        for (let i = chetou_number; i < cookiesArr.length; i++) {
            otherIndexes.push(i)
        }
        shuffle(otherIndexes)
        cookieIndexOrder = cookieIndexOrder.concat(otherIndexes)
    } else {
        let otherIndexes = []
        // 未开启公平模式，则按照顺序互助，前面的先互助满
        for (let idx = 0; idx < cookiesArr.length; idx++) {
            var cookie = cookiesArr[idx];

            if (kois.indexOf(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]) != -1) {
                otherIndexes.push(idx)
            } else {
                cookieIndexOrder.push(idx)
            }
        }
        cookieIndexOrder = otherIndexes.concat(cookieIndexOrder)
    }
    console.log(`最终互助顺序如下（优先互助满前面的）：\n${cookieIndexOrder}`)
    allMessage += `本次互助顺序(车头优先，其余等概率随机，每次运行都不一样): ${cookieIndexOrder}\n\n`

    console.log("开始助力")
    // 最多尝试2*账号数目次，避免无限尝试，保底
    let remainingTryCount = 2 * cookiesArr.length
    let helpIndex = 0
    while (helpIndex < cookiesArr.length && tools.length > 0 && remainingTryCount > 0) {
        let cookieIndex = cookieIndexOrder[helpIndex]
        try {
            if(proxyUrl){
                await getProxy();
                console.log(proxy);
            }
            // 按需获取账号的锦鲤信息
            let help;

            let cnt=0;
            do {
                try {
                    help = await getHelpInfoForCk(cookieIndex, cookiesArr[cookieIndex])
                    cnt=10;
                } catch (error) {
                    // 额外捕获异常
                    console.error(`第${cnt}次请求第${cookieIndex} 个账号信息出现错误，错误为${error}，捕获该异常，3次后进行下一个账号`)
                    cnt++;
                }
            }while (cnt<3);
            if (help) {
                while (tools.length > 0 && remainingTryCount > 0) {
                    console.info('')

                    // 从互助列表末尾取出一个账号，用于尝试助力第一个需要互助的账号
                    let tool = tools.pop()

                    // 特殊处理自己的账号
                    if (tool.id == help.id) {
                        tools.unshift(tool)
                        console.log(`跳过自己，不尝试使用本账号自己互助（因为必定失败）`)
                        if (tools.length == 1) {
                            // 用于互助的队列只剩下自己了，说明自己已经尝试完了，可以留着给下一个人（若有）
                            break
                        } else {
                            // 还有其他的互助码，可以继续尝试本账号
                            continue
                        }
                    }

                    console.debug(`尝试用 ${tool.id} 账号助力 ${help.id} 账号，用于互助的账号剩余 ${tools.length}`)
                    let helpNum=0;
                    do {
                        try {
                            await helpThisUser(help, tool)
                            helpNum=10;
                        } catch (error) {
                            // 额外捕获异常
                            console.error(`尝试用 ${tool.id} 账号助力 ${help.id} 出现错误，错误为${error}，捕获该异常，跳过此账号继续执行助力~`)
                            helpNum++;
                        }
                    }while (helpNum<5);
                    if (!tool.assisted) {
                        // 如果没有助力成功，则放入互助列表头部
                        tools.unshift(tool)
                    }
                    if (help.assist_full) {
                        console.info(`账号 ${help.id} 助力完成，累计获得 ${help.helpCount} 次互助，将尝试下一个账号`)
                        break
                    }

                    remainingTryCount -= 1

                    // 等待一会，避免频繁请求
                    if(proxyUrl){
                        await $.wait(2000)
                    }else{
                        await $.wait(2000)
                        }
                }
            } else {
                // 获取失败，跳过
                console.info(`账号 ${cookieIndex} 获取信息失败，具体原因见上一行，将尝试下一个账号`)
            }

            await appendRewardInfoToNotify(cookieIndex, cookiesArr[cookieIndex])
        } catch (error) {
            // 额外捕获异常
            console.error(`处理当前账号 ${cookieIndex} 时抛异常了，错误为${error}，捕获该异常，确保其他账号可以继续执行~`)
        }

        console.info('\n----------------------------\n')
        helpIndex++
    }

    allMessage += "上述就是本次的幸运锦鲤啦~ 自动开红包流程没出错的话，红包应该已经领到了~不过也可以手动前往 京东app/领券/锦鲤红包 去确认~\n"

    allMessage += "（请以今日0点后第一次运行的消息为准。后续运行只是为了保底，避免第一次因各种未知异常而未完成运行）"

    // 发送通知
    if ($.isNode() && allMessage) {
        await notify.sendNotify(`${$.name}`, `${allMessage}`)
    }
})().catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
})
    .finally(() => {
        $.done();
    })

// https://stackoverflow.com/a/2450976
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

async function getHelpInfoForCk(cookieIndex, cookie) {
    console.log(`开始请求第 ${cookieIndex} 个账号的信息`)
    logs = await getJinliLogs()
    console.log(logs)
    if(proxyUrl){
        if (nums % 8 == 0) {
            await getProxy();
            global.GLOBAL_AGENT.HTTP_PROXY = "http://" + proxy;
        }
        nums++;
    }
    let random = logs["random"].toString(),log =logs["log"].toString()
    //let random = decodeURIComponent(logs.match(/"random":"(\d+)"/)[1]),log = decodeURIComponent(logs.match(/"log":"(.*)"/)[1])
    let data;
    // 开启红包
    data = await with_retry("开启红包活动", async () => {
        return await requestApi('h5launch', cookie, {
            "followShop": 0,
            "random": random,
            "log": log,
            "sceneid": "JLHBhPageh5"
        });
    })

    switch (data?.data?.result?.status) {
        case 1://火爆
            console.debug(`h5launch 被风控，变成黑号了, data=${JSON.stringify(data)}`)
            return;
        case 2://已经发起过
            break;
        default:
            if (data?.data?.result?.redPacketId) {
                // 加入help队列
                return {
                    redPacketId: data.data.result.redPacketId,
                    assist_full: false,
                    id: cookieIndex,
                    cookie: cookie,
                    helpCount: 0
                }
            }
    }

    // 已开启活动，尝试查询具体信息
    data = await with_retry("查询红包信息", async () => {
        return await requestApi('h5activityIndex', cookie, {
            "isjdapp": 1
        });
    })

    if (data?.data?.result?.redpacketConfigFillRewardInfo) {
        // 打印今日红包概览
        let info = data.data.result
        let headmanNickName = "", packetTotalSum = 0;
        if (info.redpacketInfo) {
            headmanNickName = info.redpacketInfo.headmanNickName
            packetTotalSum = info.redpacketInfo.packetTotalSum
        }
        console.info(`【京东账号${cookieIndex + 1}】 ${headmanNickName} 已获取红包 ${packetTotalSum}，剩余可拆红包为 ${calcCanTakeRedpacketCount(info)}`)

        for (let packetIdx = 0; packetIdx < info.redpacketConfigFillRewardInfo.length; packetIdx++) {
            let packetInfo = info.redpacketConfigFillRewardInfo[packetIdx]

            let status = "已获取"
            if (packetInfo.hasAssistNum < packetInfo.requireAssistNum) {
                status = "未获取"
            }

            console.info(`红包 ${packetIdx + 1} 助力 ${packetInfo.hasAssistNum}/${packetInfo.requireAssistNum} ${status} ${packetInfo.packetAmount || "未开启"}/${packetInfo.operationWord}`)
        }
    }

    switch (data?.data?.code) {
        case 20002://已达拆红包数量限制
            console.debug("已领取今天全部红包，将跳过")
            break;
        case 10003://活动正在进行，火爆号
            console.debug(`h5activityIndex 被风控，变成黑号了, data=${JSON.stringify(data)}`)
            break;
        case 20001://红包活动正在进行，可拆
            // 加入help队列
            return {
                redPacketId: data.data.result.redpacketInfo.id,
                assist_full: false,
                id: cookieIndex,
                // cookie: cookie,
                helpCount: 0
            }
        default:
            break;
    }
}

async function appendRewardInfoToNotify(cookieIndex, cookie) {
    let data = await with_retry("查询红包信息", async () => {
        return await requestApi('h5activityIndex', cookie, {
            "isjdapp": 1
        });
    })

    // 判断是否有红包可以领
    if (calcCanTakeRedpacketCount(data?.data?.result) > 0) {
        let info = data.data.result
        let headmanNickName = "";
        if (info.redpacketInfo) {
            headmanNickName = info.redpacketInfo.headmanNickName
        }

        let canTakeCount = calcCanTakeRedpacketCount(info)
        console.info(`【京东账号${cookieIndex + 1}】 ${headmanNickName} 剩余可拆红包为 ${canTakeCount} 个，将尝试领取`)
        for (let packetIdx = 0; packetIdx < canTakeCount; packetIdx++) {
            console.info(`[${packetIdx + 1}/${canTakeCount}] 尝试领取红包`)
            await openRedPacket(cookie)

            // 等待一会，避免请求过快
            await $.wait(6000)
        }

        console.info(`领取完毕，重新查询最新锦鲤红包信息`)
        data = await with_retry("查询红包信息", async () => {
            return await requestApi('h5activityIndex', cookie, {
                "isjdapp": 1
            });
        })
    }

    // 打印今日红包概览
    if (data?.data?.result?.redpacketConfigFillRewardInfo) {
        let info = data.data.result
        let headmanNickName = "", packetTotalSum = 0;
        if (info.redpacketInfo) {
            headmanNickName = info.redpacketInfo.headmanNickName
            packetTotalSum = info.redpacketInfo.packetTotalSum
        }
        allMessage += `【京东账号${cookieIndex + 1}】 ${headmanNickName} 已获取红包 ${packetTotalSum} 元，剩余可拆红包为 ${calcCanTakeRedpacketCount(info)} 个（如开红包流程顺利，这里应该永远是0）\n`

        let totalAssistNum = 0
        let totalRequireAssistNum = 0
        for (let packetIdx = 0; packetIdx < info.redpacketConfigFillRewardInfo.length; packetIdx++) {
            let packetInfo = info.redpacketConfigFillRewardInfo[packetIdx]

            let status = ""
            if (packetInfo.hasAssistNum < packetInfo.requireAssistNum) {
                status = "未获取"
            } else {
                status = "已获取"
            }

            totalAssistNum += packetInfo.hasAssistNum
            totalRequireAssistNum += packetInfo.requireAssistNum
            allMessage += `红包 ${packetIdx + 1} 助力 ${packetInfo.hasAssistNum}/${packetInfo.requireAssistNum} ${status} ${packetInfo.packetAmount || "未开启"}/${packetInfo.operationWord}\n`
        }

        allMessage += `总计获得助力 ${totalAssistNum}/${totalRequireAssistNum}\n`

        allMessage += `\n`
    }
}

function calcCanTakeRedpacketCount(info) {
    if (!info?.redpacketConfigFillRewardInfo) {
        return 0
    }

    let count = 0
    for (let packetIdx = 0; packetIdx < info.redpacketConfigFillRewardInfo.length; packetIdx++) {
        let packetInfo = info.redpacketConfigFillRewardInfo[packetIdx]

        if (packetInfo.hasAssistNum >= packetInfo.requireAssistNum && !packetInfo.packetAmount) {
            count++
        }
    }

    return count
}

async function with_retry(ctx = "", callback_func, max_retry_times = 3, retry_interval = 5000) {
    let data;

    // 尝试开启今日的红包活动
    for (let tryIdex = 1; tryIdex <= max_retry_times; tryIdex++) {
        if (tryIdex > 1) {
            console.debug(`[${tryIdex}/${max_retry_times}] 重新尝试 ${ctx}`)
        }

        data = await callback_func()
        if (data) {
            break
        }

        console.error(`[${tryIdex}/${max_retry_times}] ${ctx} 请求时似乎出错了，有可能是网络波动，将等待 ${retry_interval / 1000} 秒，最多试 ${max_retry_times} 次\n`)
        await wait(retry_interval)
    }

    return data
}

async function openRedPacket(cookie) {
    logs = await getJinliLogs()
    //let random = decodeURIComponent(logs.match(/"random":"(\d+)"/)[1]),log = decodeURIComponent(logs.match(/"log":"(.*)"/)[1])
   let random = logs["random"].toString(),log =logs["log"].toString()
    // https://api.m.jd.com/api?appid=jinlihongbao&functionId=h5receiveRedpacketAll&loginType=2&client=jinlihongbao&t=1638189287348&clientVersion=10.2.4&osVersion=-1
    let resp = await requestApi('h5receiveRedpacketAll', cookie, {
        "random": random,
        "log": log,
        "sceneid": "JLHBhPageh5"
    });
    if (resp?.data?.biz_code == 0) {
        console.info(`领取到 ${resp.data.result?.discount} 元红包`)
    } else {
        console.error(`领取红包失败，结果为 ${JSON.stringify(resp)}`)
    }
}

async function helpThisUser(help, tool) {
    logs = await getJinliLogs()
    var num = "";
   let random = logs["random"].toString(),log =logs["log"].toString()
    if (proxyUrl){
        if (nums % 8 == 0) {
            await getProxy();
            console.log(proxy);
            global.GLOBAL_AGENT.HTTP_PROXY = "http://" + proxy;
        }
        nums++;
    }
    body={"redPacketId": help.redPacketId,"followShop": 0,"random": random,"log": log,"sceneid":"JLHBhPageh5"}
    // 实际发起请求
    await requestApi('jinli_h5assist', tool.cookie, body).then(async function (data) {
        let desc = data?.data?.result?.statusDesc
        if (desc) {
            if (desc.indexOf("助力成功") != -1) {
                help.helpCount += 1
                tool.assisted = true
            } else if (desc.indexOf("TA的助力已满") != -1) {
                help.assist_full = true
            } else {
                // 不能重复为好友助力哦
                // 今日助力次数已满
                // 活动太火爆啦~去看看其他活动吧~
                tool.assisted = true
            }
        } else {
            // undefined
            tool.assisted = true
        }
        console.log(`${tool.id}->${help.id}`, desc)
        if (!desc) {
            if(proxyUrl){
                await getProxy();
                console.log(proxy);
            }
            if(proxyUrl){
                await $.wait(500);
            }else {
                await $.wait(6000);
            }
            helpThisUser(help, tool);
        }
    })
}

async function requestApi(functionId, cookie, body = {}) {
    return new Promise(resolve => {
        $.post({
            url: `${JD_API_HOST}/api?appid=jinlihongbao&functionId=${functionId}&loginType=2&client=jinlihongbao&clientVersion=10.2.4&osVersion=AndroidOS&d_brand=Xiaomi&d_model=Xiaomi`,
            headers: {
                "Cookie": cookie,
                "origin": "https://h5.m.jd.com",
                "referer": "https://h5.m.jd.com/babelDiy/Zeus/2NUvze9e1uWf4amBhe1AV6ynmSuH/index.html",
                'Content-Type': 'application/x-www-form-urlencoded',
                "X-Requested-With": "com.jingdong.app.mall",
                "User-Agent": ua,
            },
            body: `body=${escape(JSON.stringify(body))}`,
        }, (_, resp, data) => {
            try {
                data = JSON.parse(data)
            } catch (e) {
                $.logErr('Error: ', e, resp)
                console.warn(`请求${functionId}失败，data=${JSON.stringify(data)}, e=${JSON.stringify(e)}`)
            } finally {
                resolve(data)
            }
        })
    })
}

async function requireConfig() {
    return new Promise(resolve => {
        notify = $.isNode() ? require('./sendNotify') : '';
        const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
        if ($.isNode()) {
            Object.keys(jdCookieNode).forEach((item) => {
                if (jdCookieNode[item]) {
                    cookiesArr.push(jdCookieNode[item])
                }
            })
            if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
            };
        } else {
            cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
        }
        console.log(`共${cookiesArr.length}个京东账号\n`)
        resolve()
    })
}
function getJinliLogs() {
    if (jdlogurl && RabbitUrl){
        console.info('进入rabbit接口获取log!')
        return rabbitLogs();
    }
    if(jdlogurl && !RabbitUrl){
        console.info('进入普通接口获取log!')
        return JdLogs();
    }
    if(RabbitUrl && !jdlogurl){
        console.info('进入rabbit接口获取log!')
        return rabbitLogs();
    }
    return '';
}
function JdLogs(){
    var logs = '';
    return new Promise((resolve) => {
        let url = {
            url:`${jdlogurl}`,
            timeout: 30000
        }
        $.get(url, async(err, resp, data) => {
            try {
                data = JSON.parse(data);
                if (data && data.status == 0) {
                    logs = {
                        random: data.random,
                        log: data.log
                    }
                    //console.info(logs['random']+"----"+logs['log'])
                    if (logs != '')
                        resolve(logs);
                    else
                        console.log("log获取失败.");
                } else {
                    console.log("log获取失败.");
                }

            }catch (e) {
                $.logErr(e, resp);
            }finally {
                resolve(logs);
            }
        })
    })
}
function rabbitLogs(){
    var logs = '';
    return new Promise((resolve) => {
        let url = {
            url:`${RabbitUrl}`,
            followRedirect: false,
            timeout: 30000
        }
        $.get(url, async(err, resp, data) => {
            try {
                data = JSON.parse(data);
                if (data && data.data.status === 0) {
                    logs = {
                        random: data.data.random,
                        log: data.data.log
                    }
                } else if (data.data.error === '\u8ba1\u7b97\u670d\u52a1\u51fa\u9519\u4e86') {
                    console.log("\u8ba1\u7b97\u670d\u52a1\u51fa\u9519\u4e86");
                } else if (data.success === false) {
                    console.log("获取Log次数达到上限");
                } else {
                    console.log("Log获取失败");
                }
            }catch (e) {
                $.logErr(e, resp);
            }finally {
                resolve(logs);
            }
        })
    })
}
// 获取代理
function getProxy(){
    return new Promise((resolve) => {
        let url = {
            url:`${proxyUrl}`,
            timeout: 30000
        }
        $.get(url, async(err, resp, data) => {
            try {
                let reg = JSON.parse(data);
                let regg = reg.data[0];
                let p = regg.IP + ":" + regg.Port;
                console.log('代理ip:'+ p);
                global.GLOBAL_AGENT.HTTP_PROXY = "http://" + p;
            }catch (e) {
                $.logErr(e, resp);
            }finally {
                resolve();
            }
        })
    })
}
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:h}=t;e(null,{status:i,statusCode:r,headers:o,rawBody:h},s.decode(h,this.encoding))},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:h}=t;e(null,{status:s,statusCode:r,headers:o,rawBody:h},i.decode(h,this.encoding))},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
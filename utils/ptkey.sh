tk(){
curl -s -k -i --raw -o tk -X GET -H "Host:$host" -H "User-Agent:Mozilla/5.0 (Linux; Android 10; V1838T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36" "http://$host/open/auth/token?client_id=$client_id&client_secret=$client_secret"
tt=$(cat tk | grep -o "token_type.*" | cut -d '"' -f3)
tk=$(cat tk | grep -o "token.*" | cut -d '"' -f3)
qck="$tt $tk"
message=$(cat tk | grep -o "message.*" | cut -d '"' -f3)
[ -z $tk ] && echo $message请检查青龙常量$qlcl || echo 青龙token获取成功
}
ev(){
t=$(expr $(date +%s%N) / 1000000)
curl -s -k -i --raw -o ev -X GET -H "Host:$host" -H "User-Agent:Mozilla/5.0 (Linux; Android 10; V1838T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36" -H "Authorization:$qck" "http://$host/open/envs?searchValue=&t=$t"
}
xz(){
t=$(expr $(date +%s%N) / 1000000)
d="[{\"value\":\"$jdc\",\"name\":\"JD_COOKIE\"}]"
l=$(echo $d | wc -c) && l=$((l-1))
curl -s -k -i --raw -o xz -X POST -H "Host:$host" -H "Content-Length:$l" -H "Authorization:$qck" -H "User-Agent:Mozilla/5.0 (Linux; Android 10; V1838T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36" -H "Content-Type:application/json;charset=UTF-8" -d "$d" "http://$host/open/envs?t=$t"
ev
[ $(cat xz | grep -c '"_id"') -eq 1 -a $(cat ev | grep -o "$pt_key" | wc -l) -eq 1 ] && echo 已成功新增到青龙 || xz
}
xg(){
_id=$(cat ev | grep -o "$pt_pin.*" | cut -d '"' -f5)
r=$(cat ev | grep -o "$pt_pin.*" | cut -d '"' -f21)
if [ ! -z $r ]
then if [ $r = "remarks" ]
then remarks=$(cat ev | grep -o "$pt_pin.*" | cut -d '"' -f23)
ab="\"remarks\":\"$remarks\","
fi
fi
t=$(expr $(date +%s%N) / 1000000)
d="{\"name\":\"JD_COOKIE\",\"value\":\"$jdc\",$ab\"_id\":\"$_id\"}"
l=$(echo $d | wc -c) && l=$((l-1))
curl -s -k -i --raw -o xg -X PUT -H "Host:$host" -H "Content-Length:$l" -H "Authorization:$qck" -H "User-Agent:Mozilla/5.0 (Linux; Android 10; V1838T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36" -H "Content-Type:application/json;charset=UTF-8" -d "$d" "http://$host/open/envs?t=$t"
ev
if [ $(cat xg | grep -c 'code":200') -eq 1 -a $(cat ev | grep -o "$pt_key" | wc -l) -eq 1 ]
then echo 已成功更新到青龙
else message=$(cat xg | grep -o "message.*" | cut -d '"' -f3)
echo $message更新到青龙失败
xg
fi
}
cl(){
echo "需要上传ptkey到青龙的请输入青龙常量，格式为
ip:端口或青龙地址@client_id@client_secret
例：ip:端口@VQjH8nYh_qSt@KRi575bgu7D-nNIZ5Kpv2O-"
stty -echo
read -p "请输入青龙常量: " qlcl
stty echo
host=$(echo $qlcl | cut -d '@' -f1)
client_id=$(echo $qlcl | cut -d '@' -f2)
client_secret=$(echo $qlcl | cut -d '@' -f3)
[ ! -z $qlcl ] && tk
if [ -z $qlcl ]
then stty -echo
read -p "请输入手机号: " mobile
stty echo
a=$(echo $mobile | grep -o "[0-9]\+")
b=$(echo $mobile | cut -c 1)
if [ ${#mobile} -ne 11 -o ${#a} -ne 11 -o $b != 1 ]
then echo $mobile不是正确的手机号
mobile=""
fi
appid=959
qversion=1.0.0
country_code=86
elif [ ! -z $tk ]
then stty -echo
read -p "请输入手机号: " mobile
stty echo
a=$(echo $mobile | grep -o "[0-9]\+")
b=$(echo $mobile | cut -c 1)
if [ ${#mobile} -ne 11 -o ${#a} -ne 11 -o $b != 1 ]
then echo $mobile不是正确的手机号
mobile=""
fi
appid=959
qversion=1.0.0
country_code=86
fi
}
ck(){
ts=$(expr $(date +%s%N) / 1000000)
sub_cmd=1
gsign=$(echo -n $appid$qversion$ts"36"$sub_cmd"sb2cwlYyaCSN1KUv5RHG3tmqxfEb8NKN" | md5sum | cut -d ' ' -f1)
d="client_ver=1.0.0&gsign=$gsign&appid=$appid&return_page=https%3A%2F%2Fcrpl.jd.com%2Fn%2Fmine%3FpartnerId%3DWBTF0KYY%26ADTAG%3Dkyy_mrqd%26token%3D&cmd=36&sdk_ver=1.0.0&sub_cmd=$sub_cmd&qversion=$qversion&ts=$ts"
l=${#d}
curl -s -k -i --raw -o ck -X POST -H "Host:qapplogin.m.jd.com" -H "cookie:" -H "user-agent:Mozilla/5.0 (Linux; Android 10; V1838T Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.87 Mobile Safari/537.36 hap/1.9/vivo com.vivo.hybrid/1.9.6.302 com.jd.crplandroidhap/1.0.3 ({"packageName":"com.vivo.hybrid","type":"deeplink","extra":{}})" -H "accept-language:zh-CN,zh;q=0.9,en;q=0.8" -H "content-type:application/x-www-form-urlencoded; charset=utf-8" -H "content-length:$l" -H "accept-encoding:" -d "$d" "https://qapplogin.m.jd.com/cgi-bin/qapp/quick"
gsalt=$(cat ck | grep -o "gsalt.*" | cut -d '"' -f3)
guid=$(cat ck | grep -o "guid.*" | cut -d '"' -f3)
lsid=$(cat ck | grep -o "lsid.*" | cut -d '"' -f3)
rsa_modulus=$(cat ck | grep -o "rsa_modulus.*" | cut -d '"' -f3)
ck=$(echo "guid=$guid;  lsid=$lsid;  gsalt=$gsalt;  rsa_modulus=$rsa_modulus;")
}
sc(){
if [ ! -z $mobile ]
then ts=$(expr $(date +%s%N) / 1000000)
sub_cmd=2
gsign=$(echo -n $appid$qversion$ts"36"$sub_cmd$gsalt | md5sum | cut -d ' ' -f1)
sign=$(echo -n $appid$qversion$country_code$mobile'4dtyyzKF3w6o54fJZnmeW3bVHl0$PbXj' | md5sum | cut -d ' ' -f1)
d="country_code=$country_code&client_ver=1.0.0&gsign=$gsign&appid=$appid&mobile=$mobile&sign=$sign&cmd=36&sub_cmd=$sub_cmd&qversion=$qversion&ts=$ts"
l=${#d}
curl -s -k -i --raw -o sc -X POST -H "Host:qapplogin.m.jd.com" -H "cookie:$ck" -H "user-agent:Mozilla/5.0 (Linux; Android 10; V1838T Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.87 Mobile Safari/537.36 hap/1.9/vivo com.vivo.hybrid/1.9.6.302 com.jd.crplandroidhap/1.0.3 ({"packageName":"com.vivo.hybrid","type":"deeplink","extra":{}})" -H "accept-language:zh-CN,zh;q=0.9,en;q=0.8" -H "content-type:application/x-www-form-urlencoded; charset=utf-8" -H "content-length:$l" -H "accept-encoding:" -d "$d" "https://qapplogin.m.jd.com/cgi-bin/qapp/quick"
err_msg=$(cat sc | grep -o "err_msg.*" | cut -d '"' -f3)
[ -z $err_msg ] && echo 验证码发送成功 || echo $err_msg
fi
}
pt(){
if [ ! -z $mobile ]
then read -p "请输入验证码: " smscode
ts=$(expr $(date +%s%N) / 1000000)
sub_cmd=3
gsign=$(echo -n $appid$qversion$ts"36"$sub_cmd$gsalt | md5sum | cut -d ' ' -f1)
d="country_code=$country_code&client_ver=1.0.0&gsign=$gsign&smscode=$smscode&appid=$appid&mobile=$mobile&cmd=36&sub_cmd=$sub_cmd&qversion=$qversion&ts=$ts"
l=${#d}
curl -s -k -i --raw -o pt -X POST -H "Host:qapplogin.m.jd.com" -H "cookie:$ck" -H "user-agent:Mozilla/5.0 (Linux; Android 10; V1838T Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.87 Mobile Safari/537.36 hap/1.9/vivo com.vivo.hybrid/1.9.6.302 com.jd.crplandroidhap/1.0.3 ({"packageName":"com.vivo.hybrid","type":"deeplink","extra":{}})" -H "accept-language:zh-CN,zh;q=0.9,en;q=0.8" -H "content-type:application/x-www-form-urlencoded; charset=utf-8" -H "content-length:$l" -H "accept-encoding:" -d "$d" "https://qapplogin.m.jd.com/cgi-bin/qapp/quick"
err_msg=$(cat pt | grep -o "err_msg.*" | cut -d '"' -f3)
if [ -z $err_msg ]
then pt_key=$(cat pt | grep -o "pt_key.*" | cut -d '"' -f3)
pt_pin=$(cat pt | grep -o "pt_pin.*" | cut -d '"' -f3)
jdc="pt_key=$pt_key;pt_pin=$pt_pin;"
if [ ! -z $tk ]
then echo jdc获取成功接下来为你上传至青龙
ev
if [ $(cat ev | grep -o "$pt_pin" | wc -l) -eq 0 ]
then xz
elif [ $(cat ev | grep -o "$pt_pin" | wc -l) -eq 1 ]
then xg
else echo 已存在多个相同jdc，请联系你的代挂删除后重新添加
fi
else echo 你的JD_COOKIE为 $jdc
fi
else echo $err_msg请检查手机号$mobile是否正确
fi
fi
}
cl && ck && sc
[ -z $err_msg ] && pt
## 使用腾讯云CDN,COS以及万象优图实现HTTP/2样例

作者:linktang

>HTTP/1.1已经陪伴了我们很多年，随着我们的网络带宽条件越来越好，HTTP/1.1的性能问题日益凸显，而HTTP/2标准的推出正是可以解决这个问题。为了直观的看到使用HTTP/2协议所带来的优化效果，本文将介绍如何使用腾讯云CDN,COS以及万象优图来实现一个简单的demo。

****************
### HTTP/2的优势

1. 多路复用
在HTTP/1.1中，浏览器并发多个请求，必须使用多个TCP链接，而浏览器会对单个域名有6-8的个数限制，因此出现了散列域名等优化策略；
而在HTTP/2中，同域名下多个请求和响应可在单个TCP连接上完成, 请求之间并行处理。
考虑到大部分网站中图片请求是占比比较高的，随着请求数这部分的优化

2. 头部压缩
HTTP/2中使用专门设计的HPACK来对headers进行压缩处理，这里的性能提升相对较小，本文暂不讨论

3. Server Push
目前服务端支持较少，本文暂不涉及

***********

### 一图胜千言
![效果图](https://h2.qcloudcdn.com/index.gif)

或者直接访问 [https://imgcache.qq.com/qcloud/cdn/official/h2test/index.html](https://imgcache.qq.com/qcloud/cdn/official/h2test/index.html)

**注意：需要使用支持HTTP/2的浏览器，建议使用谷歌Chrome或者QQ浏览器（高速内核）**

具体浏览器支持可以查询 [http://caniuse.com/#search=http2](http://caniuse.com/#search=http2)

该示例的代码在[https://github.com/tencentyun/cdn-http2-test](https://github.com/tencentyun/cdn-http2-test)

**********

### HTTP/2 样例的解析

#### 页面组成

在本例子中，为了对比HTTP/1.1和HTTP/2在多图片加载情况下的性能差异，我们需要准备3个页面：
1. **index.html**: 入口页面，我部署在imgcache.qq.com这个域名了，也可以部署在其他域名，或者本地打开都可以;
2. **test-h1.html**: HTTP/1.1测试页面，我部署在h1.qcloudcdn.com这个域名，该页面内嵌了400个小图片;
3. **test-h2.html**: HTTP/2测试页面，我部署在h2.qcloudcdn.com这个域名，该页面内嵌了400个小图片;




#### 样例架构
![架构图](https://h2.qcloudcdn.com/main-1.png)


#### 测试效果

在我的100M网速+Win7 Chrome56的条件下测试，HTTP/1.1全部400个图片加载完毕约1.8s，而HTTP/2只需要0.4s，加载时间大大缩短！

**注意：不同的网络，机器环境下，测试数据可能会有差异，因此为了更准确与公平，建议您获取代码后部署到自己的环境上再进行测试**

#### 基本原理

test-h1.html和test-h2.html以iframe的形式嵌入到index.html里。俩个测试页面分别使用了2组图片分别进行加载，每组包含400个图片，每组图片部署在不同的域名，在每组图片完全加载完毕之后统计页面加载总时间。

为了保证公平，当打开index.html的时候，会先加载test-h1.html的内容，等完全加载完毕之后，再开始加载test-h2.html的内容。

**注意：由于test-h2.html的资源是通过HTTP/2协议加载的，默认都启用了HTTPS证书，为了保证公平，test-h1.html内的资源也必须用HTTPS访问**

#### 图片生成

这里有一个难点，就是如何用大图生成400个小图？如果我想更换其他图片，或者切分成更细的粒度，改动成本是很高的。
所以我这里用到了**万象优图**的**图片裁剪**功能，简单介绍一下，当图片上传到万象优图的Bucket内之后，可以**直接根据访问的url进行图片裁剪**！

举个例子，在上面的示例中，我的原图是[https://h2.qcloudcdn.com/qcloud-h2.jpg](https://h2.qcloudcdn.com/qcloud-h2.jpg)
使用万象优图的裁剪接口的话，比如我要获取左上角坐标(0,0),宽高是64*64那块图片，则可以直接访问[https://h2.qcloudcdn.com/qcloud-h2.jpg?imageMogr2/cut/64x64x0x0](https://h2.qcloudcdn.com/qcloud-h2.jpg?imageMogr2/cut/64x64x0x0)

聪明的你一看就明白，图片裁剪就是在url后面加上
**?imageMogr2/cut/{width}x{height}x{x}x{y}**
其中width是你需要裁剪的图像宽度像素值，height表示高度，x表示距离左上角原点的横坐标距离，y表示距离左上角原点的纵坐标距离

就是这么简单！通过url参数，我就可以获得图片的任意一小块，可以大大减少图片切分的工作量！并且可以通过程序生成各种想要的版本





*************

### 样例构建过程

下面我会介绍一下这个例子完整的搭建的过程，这代表阅读完本文之后，您也可以完全用自己的资源搭建一个HTTP/2的示例网站用于测速比较。对于开发者来说，图片存储，图片切割处理以及证书获取, 静态服务器支持HTTP/2等都是比较繁琐的事，而使用腾讯云可以比较方便的解决上述问题。其中

1. CDN：加速访问，免费申请证书，支持HTTP/2开关
2. COS(腾讯云对象存储): 支持各种文件存储
3. 万象优图：支持图片在线实时裁剪处理

#### 自己构建有什么好处吗？

在上面的示例中我使用了腾讯云的一个1280*1280大小的图片，分割成20*20共400块大小来进行页面展示，您通过自己构建的话，可以很方便的替换图片（自定义url），自己定分块的大小（比如分成5*5,10*10的块）来测试不同并发数情况下HTTP/2的优化效果。


#### 资源准备
1. 准备2个域名，其中一个作为主域名放置html页面，另外两个做静态资源域名，静态资源域名需要分配2个子域名进行对比。
在前面的示例中，我使用了imgcache.qq.com作为我的主域名（存放入口页面），使用h1.qcloudcdn.com以及h2.qcloudcdn.com作为我的静态资源域名（存放具体的资源对比页面）。
如果您还没有域名，可以到dnspod购买 [点击购买域名](https://dnspod.qcloud.com)


2. 注册腾讯云，开通[CDN](https://console.qcloud.com/cdn), [COS](https://console.qcloud.com/cos4), [万象优图](https://console.qcloud.com/ci)的功能

3. 申请开通CDN HTTP/2功能，[点击申请](https://www.qcloud.com/act/apply/cdn_http2)

4. 创建COS Bucket，这一步比较简单，也可以参考文档 [创建COS Bucket](https://qcloud.com/document/product/436/6245)，创建完成之后，您可以上传任意类型的文件到COS中，而其中图片类型的文件可以使用万象优图进行处理;

5. 创建万象优图Bucket, 这一步与上一步类似，注意的是创建的时候选择已有COS Bucket即可，也可以参考文档[创建万象优图 Bucket](https://qcloud.com/document/product/460/6932)

6. 选择一个图片测试文件上传到万象优图的Bucket里。建议选择一个正方形的图片，建议不要太小，在前面的示例中，我选择的是一个1280*1280的图片，大小在2M左右，可以参考下。 [万象优图-图片上传](https://qcloud.com/document/product/460/6935)

7. 关联CDN。图片上传OK后，通过万象优图提供的源站域名是可以直接访问的，但源站尚未支持HTTP/2，我们需要接入CDN，在万象优图的域名管理里面，添加我们的静态资源域名（注意是2个哦），可以参考文档[万象优图-自定义域名设置](https://qcloud.com/document/product/460/6937#4.-.E8.87.AA.E5.AE.9A.E4.B9.89.E5.9F.9F.E5.90.8D)

8. 设置HTTPS证书。在CDN控制台，找到我们的2个静态资源域名，配置HTTPS证书，可以使用自己的证书或者申请免费证书，[CDN证书管理](https://www.qcloud.com/document/product/228/6303)

9. 开启HTTP/2设置。在CDN控制台，进入我们域名的高级配置，开启即可。[CDN-HTTP/2设置](https://www.qcloud.com/document/product/228/6295#http2.06)




************


#### 样例代码修改

我下载了样例的代码，我想用其他图片测试HTTP/2的效果，或者我想切分成10*10的分块看看效果，怎么做呢？

1. 本地环境准备，需要您的环境安装nodejs以及npm, 之后再安装gulp, 这一步骤资料很多，本文不在赘述；

2. 将代码下载到本地，进入代码目录，运行npm i (安装依赖)

3. 修改gulpfile.js里的配置参数，然后运行gulp, 将会自动生成test-h1.html和test-h2.html，这个时候可以直接浏览器打开index.html看看效果，确认OK之后，再把目录下的index.html,test-h1.html和test-h2.html部署到您的主域名里即可
```js
//gulpfile.js里的配置参数说明
var IMG_PATH_H1 = 'https://h1.qcloudcdn.com/qcloud-h1.jpg';//用于HTTP/1.1的测试图片
var IMG_PATH_H2 = 'https://h2.qcloudcdn.com/qcloud-h2.jpg';//用于HTTP/2的测试图片
var IMG_WIDTH = 1280;//测试图片的宽度
var IMG_HEIGHT = 1280;//测试图片的高度
SPLIT_X = SPLIT_Y = 20;//测试图片分块数，这里填20就意味着分割成20*20=400个小图
```

**注意：每次修改gulpfile.js的参数后，记得重新运行一下gulp,这样保证生成的页面是最新的。**

*****************

### 关于示例的FAQ

1. 为什么我本地调试的时候，有时候看到整个一组图的加载时间只有几十毫秒？
答：有可能是因为缓存，在chrome浏览器里可以打开调试面板，切换到Network标签，勾选Disable Cache，这样就能避免缓存带来的影响

2. 为什么一定要申请HTTPS证书呢？HTTP/2协议实现里并没有强制要求。
答：虽然协议里没有要求，但目前主流浏览器都默认实现的HTTP/2协议必须要HTTPS支持，同时为了测试对比的公平性，在HTTP/1.1的示例中也开启了HTTPS。

3. 有时候看到示例页面里HTTP/2的请求耗时特别长比正常加载慢很多？
答：观察一下具体的每个请求的情况，目前示例里是计算总的加载时间的，有时候因为某些网络原因导致某个请求超时了，就可能拖慢整体的加载时间

4. 我有自己的文件分割工具，不用优图的实时切割可以吗？
答：当然可以，但是需要您把图片分割好之后，上传到指定的域名，然后修改页面里生成<img>标签的对应的代码即可。但是这样就比较难实现动态修改参数生成页面。

5. 我如何确定静态资源是通过HTTP/2来访问的呢？
答：在chrome浏览器里，可以打开调试面板，切换到Network标签，可以看到请求的Protocal,如果没看到，点击这一列，勾选即可


6. 我自己的网站静态资源都是HTTP/1.1请求的，怎么样尽快切换到HTTP/2呢？
答：把你的静态资源域名接入腾讯云CDN，然后在控制台开启HTTP/2即可。[域名接入文档](https://www.qcloud.com/document/product/228/5734)

7. 我自己的网站静态资源都相对稳定了，部署在我自己的域名里，我想用万象优图的图片处理功能可以吗？
答：可以参考这里[自定义域名接入](https://qcloud.com/document/product/460/6937#4.-.E8.87.AA.E5.AE.9A.E4.B9.89.E5.9F.9F.E5.90.8D)

8. 我用fiddler抓包发现都是HTTP/1.1请求的？
答：因为fiddler目前还没支持HTTP/2协议的抓包，会自动降级到HTTP/1.1



****************
### 小结
本文主要介绍了HTTP/2对比HTTP/1.1在性能上的突出优势，通过支持请求与响应的多路复用来达到低延迟的效果，同时实现了一个在线的对比样例，并具体介绍了使用腾讯云CDN,COS,以及万象优图搭建这个样例的过程。如果你的网站还没使用HTTP/2，赶快来试一试吧！






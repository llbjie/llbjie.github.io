---
title: 执行 jupyter-lab 命令后，浏览器显示拒绝访问文件
categories: 遇到的各种问题
abbrlink: e0801949
date: 2025-05-09 12:33:01
---

执行`jupyter-lab`命令后，浏览器显示拒绝访问文件
<!-- more -->

## 描述

在管理员终端执行

```shell
$ jupyter-lab
# 输出
#   To access the server, open this file in a browser:
#        file:///C:/Users/***/AppData/Roaming/jupyter/runtime/jpserver-22612-open.html
#    Or copy and paste one of these URLs:
#       http://localhost:8888/lab?token=d973fd9422e6b7d0b1a517a23f58027b5b09475cce6053b9
```

`http://`路径可以访问，但是不能以`file://`的形式访问

浏览器显示的内容：

```text
# 拒绝访问文件
**file:///C:/Users/***/AppData/Roaming/jupyter/runtime/jpserver-22612-open.html** 处的文件不可读。 它可能已被移动或删除，或者文件权限可能正在阻止访问。
```

浏览器控制台的输出：

```text
chromewebdata/:1  Not allowed to load local resource: file:///C:/Users/***/AppData/Roaming/jupyter/runtime/jpserver-24248-open.html
```

但是在非管理员终端执行`jupyter-lab`能够通过`file://`的方式访问

## 解决方法

修改文件夹`runtime`当前用户的权限为完全控制

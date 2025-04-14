---
title: cmu15455 project0踩坑记录
categories: cmu15455-2024fall
abbrlink: 43cd74e0
date: 2025-03-21 11:13:13
tags: hyperloglog
toc: true
---

实验要求：[24fall project 0](https://15445.courses.cs.cmu.edu/fall2024/project0/)

实验有两个任务：
Task1: 实现一个基础的`HyperLogLog`，使用了稀疏布局，文件包括`hyperloglog.h`和`hyperloglog.cpp`
Task2: `HyperLogLog_presto`，使用了密集布局，文件包括`hyperloglog_presto.h`和`hyperloglog_presto.cpp`
<!-- more -->

## 环境配置

我的实验环境为：`windows11 + wsl + ubuntu24.04LTS + vscode`

### 安装依赖

按照[实验指引](https://github.com/cmu-db/bustub#cloning-this-repository)，操作到如下命令的时候

```shell
# Linux
sudo build_support/packages.sh

# 结果
Unsupported distribution 'LINUX'
Please contact our support team for additional help.
Be sure to include the contents of this message.
Platform: Linux ll 5.15.167.4-microsoft-standard-WSL2 #1 SMP Tue Nov 5 00:21:55 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

提示我们不支持的系统版本，解决办法可以参考下面的内容

找到这个 `packages.sh`文件,里面有如下的内容

```sh
 41     LINUX)
 42       version=$(cat /etc/os-release | grep VERSION_ID | cut -d '"' -f 2)
 43       case $version in
 44         18.04) install_linux ;;
 45         20.04) install_linux ;;
 46         22.04) install_linux ;;
 47         *) give_up ;;
 48       esac
 49       ;;
 50
 51     *) give_up ;;
```

按照实验指引, 只支持这三个版本的linux, 所以需要修改
执行下面的命令

```shell
cat /etc/os-release | grep VERSION_ID | cut -d '"' -f 2
24.04
```

我的结果是24.04， 所以修改 `packages.sh`文件

```shell
   18.04) install_linux ;;
 45         20.04) install_linux ;;
 46         22.04) install_linux ;;
 46         24.04) install_linux ;;
 47         *) give_up ;;
 48       esac
```

当然也可以直接执行`install_linux`函数的命令，这个函数在文件的最下面
然后重新安装依赖

```shell
# Linux
sudo build_support/packages.sh
```

可能会出现找不到依赖的情况(时间过于久远，记不太清了)， 执行下面的命令

```shell
sudo vim /etc/apt/sources.list
```

然后将下面的内容保存到文件中

```shell
deb http://apt.llvm.org/noble/ llvm-toolchain-noble main
deb-src http://apt.llvm.org/noble/ llvm-toolchain-noble main
# 19
deb http://apt.llvm.org/noble/ llvm-toolchain-noble-19 main
deb-src http://apt.llvm.org/noble/ llvm-toolchain-noble-19 main
# 20
deb http://apt.llvm.org/noble/ llvm-toolchain-noble-20 main
deb-src http://apt.llvm.org/noble/ llvm-toolchain-noble-20 main
```

这里的内容取决于系统，如果和我的系统不一致，请参考[llvm](https://apt.llvm.org/)修改

再重新安装依赖

## cmake构建

继续按照[实验指引](https://github.com/cmu-db/bustub#cloning-this-repository)

```shell
mkdir build
cd build
cmake ..
```

可能会出现以下的输出

```shell

CMake Warning at CMakeLists.txt:52 (message):
  !! We recommend that you use clang-14 for developing BusTub.  You're using
  Clang 21.0.0, a different version.
```

这个是因为实验要求的版本是`clang-14`,而我的是`clang-21`
一个比较简单直接的方法是，找到仓库最外层的目录（例如我这里是`bustub-private`），这里有一个`CMakeLists.txt`文件，注释掉文件的`51和52`行

```shell
if(CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
        if(CMAKE_CXX_COMPILER_VERSION MATCHES "^14.")
                message(STATUS "You're using ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
        # else()
        #         message(WARNING "!! We recommend that you use clang-14 for developing BusTub. You're using ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}, a different version.")
        endif()
```

也可能有下面的输出

```shell
CMake Deprecation Warning at third_party/backward-cpp/CMakeLists.txt:23 (cmake_minimum_required):
  Compatibility with CMake < 3.5 will be removed from a future version of
  CMake.

  Update the VERSION argument <min> value or use a ...<max> suffix to tell
  CMake that the project does not need compatibility with older versions.
```

这也是因为版本的问题，进入最外层目录的`third_party`目录，修改输出里面提到的第三方库的`CMakeLists.txt`里面的内容

```shell
cmake_minimum_required(VERSION 3.5)
```

具体版本按照命令行输出修改
然后在vscode安装插件，就可以愉快的进行实验了（笑

## 提交实验

按照实验要求，需要提交一个压缩包

```shell
make submit-p0
```

这个命令会将实验0打成一个压缩包，我这里是`project0-submission.zip`,在最外层目录
这里也可能会出现问题，我完成实验时候，是做的`2024fall`学期，但是`github`仓库已经是`2025spring`版本了，导致压缩的文件不对。可以参考下面的方法解决

修改最外层`CMakeLists.txt`，修改`262`行的内容为

```shell
set(P0_FILES
        "src/include/primer/hyperloglog.h"
        "src/include/primer/hyperloglog_presto.h"
        "src/primer/hyperloglog.cpp"
        "src/primer/hyperloglog_presto.cpp"
)
```

具体行数可能有变化，可以在文件中搜索`P0_FILES`来定位

接下来就是实验中遇到的问题了

## `bitset`索引

正常的数组,如`[1,2,3,4,5]`,其索引从左到右依次增加

```cpp
    int nums[]{1,2,3,4,5}
    for (int i = 0; i < 5; i++) {
        cout << nums[i] << " ";
    }
```

输入的结果为`1 2 3 4 5`

但是`bitset`的索引正好相反，最右侧的为`0`，最左侧的为`size - 1`
比如`[1000,1000]`, 按照索引从`0`开始遍历， 结果是 `0001,0001`

## 一些小细节

还有的就是一些微不足道的小细节，需要动用我们脑中的灰色细胞（波洛语

- Task2中，如果`0`的个数大于`bashline`,需要将其分成两部分保存，如何确定`baseline`关键在于`dense_bucket_`的容量，例如这里是`#define DENSE_BUCKET_SIZE 4`，4bit能表示最大的数为15，大于这个数的都需要分成两部分
- 计算求和的时候，需要将`dense_bucket_`和`overflow_bucket_`指定位置的值重新组合成0的个数

整体来说，实验内容不是很难，难度更大的地方在于环境的配置和c++语法以及题意的理解上
以上，下个实验见

---
title: 使用pipx安装Jupyter Lab
tags: [pipx, Jupyter Lab]
abbrlink: 9cafca2a
date: 2025-05-29 13:47:17
---

如何使用`pipx`安装`Jupyter Lab`,并注册新的内核

<!-- more -->
## 安装 `Jupyter Lab`

```shell
pipx install jupyterlab --include-deps
```

`--include-deps` 参数的作用：

* 默认情况下 pipx 只安装​​直接依赖​​（即 jupyterlab 包本身）
* 添加此参数后会​​额外安装完整依赖树​​，包括：
  * Jupyter 核心组件（notebook, jupyter-core）
  * IPython 内核
  * 前端依赖（如 jupyter-server, jupyter-client）
  * 其他必要组件

## 安装常用依赖

一些常用的依赖，直接安装到jupyter环境中可能是更好的选择

```shell
pipx inject jupyterlab pandas
pipx ensurepath
```

## 注册新内核

查看已经注册的内核

```shell
jupyter kernelspec list
Available kernels:
  python3  C:\Users\***\pipx\venvs\jupyterlab\share\jupyter\kernels\python3
```

可以直接在当前虚拟环境中安装一个内核，并将其注册到`jupyter`中

```shell
pip install ipykernel
python -m ipykernel install --display-name "$(Get-Location)" --name "$(Split-Path -Leaf (Get-Location))"

# 查看内核
jupyter kernelspec list
Available kernels:
  python3                           C:\Users\***\pipx\venvs\jupyterlab\share\jupyter\kernels\python3
  introduction_to_ml_with_python    C:\Users\***\AppData\Roaming\jupyter\kernels\introduction_to_ml_with_python
```

启动后可以看到两个内核

```shell
jupyter lab
```

![alt text](images/image.png)
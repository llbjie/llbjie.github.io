---
title: 【高速上手C++ 11/14/17】 笔记1 
abbrlink: 2878811c
date: 2026-02-02 16:34:35
tags: cpp
---
高速上手 C++ 11/14/17的学习笔记，包括：
- `nullptr` 和 `NULL`

<!-- more -->
## `nullptr` 和 `NULL`

C++11 引入了 `nullptr` 关键字代替 `NULL`。

`NULL` 最初出现在 `C` 语言中，是一个宏定义，可能是 `0` 或 `((void*)0)`
如果在代码中使用`NULL`，会产生问题，例如：
```cpp
auto f(int *p) -> void {}
auto f(int a) -> void {}
int main() {
    f(NULL);
}
```
使用`clang++`编译出错:
```shell
chapter_2.cpp:16:3: error: call to 'f' is ambiguous
   16 |   f(NULL);
      |   ^
chapter_2.cpp:6:6: note: candidate function
    6 | void f(int a) {
      |      ^
chapter_2.cpp:10:6: note: candidate function
   10 | void f(int* p) {
      |      ^
1 error generated.
```
出现了歧义，无法从两个候选函数中做出选择。`C++11`引入了关键字 `nullptr`，目的是区分空指针和`0`

`nullptr`也有其专门的类型`std::nullptr_t`:
```cpp
std::cout << std::is_same_v<decltype(nullptr), std::nullptr_t>; // true
```
`std::nullptr_t`的定义是一个循环定义：
```cpp
#if __cplusplus >= 201103L
  typedef decltype(nullptr)	nullptr_t;
#endif
``` 

除了上面提到的区分重载函数的作用外，`nullptr`还有下面两种用途：
- 区分返回值
- 模板参数推导

区分返回值：
当使用 `auto` 自动推导函数的返回值类型时, 
```cpp
auto res = f(/* arguments */);
// 1. 情况1
if (res == 0) {} 

// 2， 情况2
if (res == nullptr) {}
```
在情况1，无法确定函数的返回值类型是整型或者是指针，而情况2可以确定返回值是一个指针

模板参数推导：
有下面的代码，
```cpp
#include <cstddef>
#include <ios>
#include <iostream>
#include <memory>
#include <type_traits>

auto g1(std::unique_ptr<int> uptr) {
  std::cout << "g1\n";
}

auto g2(std::shared_ptr<int> sptr) {
  std::cout << "g2\n";
}

auto g3(int* ptr) {
  std::cout << "g3\n";
}

int main() {  
  g1(NULL);
  g2(0);
  g3(nullptr);
}
```
`g1`, `g2`, `g3`都可以正常编译并执行，但是当使用模板进行参数类型推导时，
```cpp
template<typename FuncType,
         typename MuxType,
         typename PtrType>
decltype(auto) lockAndCall(FuncType func,       //C++14
                           MuxType& mutex,
                           PtrType ptr)
{ 
    MuxGuard g(mutex);  
    return func(ptr); 
}

// 进行调用
auto result1 = lockAndCall(f1, f1m, 0);         //错误！
...
auto result2 = lockAndCall(f2, f2m, NULL);      //错误！
...
auto result3 = lockAndCall(f3, f3m, nullptr);   //没问题
```
因为`0`和`NULL`被推导成整型，传递给函数`func`时与参数类型不匹配，但 `nullptr`可以隐式转换成任意指针类型

参考:

[effective modern cpp](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item8.html)

[高速上手C++ 11/14/17](https://changkun.de/modern-cpp/zh-cn/02-usability/)
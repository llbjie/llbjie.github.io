---
title: CSAPP BombLab
categories: CSAPP
abbrlink: f788923f
date: 2024-12-05 13:15:48
toc: true
---

csapp BombLab

<!-- more -->

## 第一个炸弹

### 使用 `gdb` 调试程序

```shell
gdb bomb
```

### 在 74 行处设置一个断点

```c
38  char *input;
......
73  input = read_line();             /* Get input                   */
74  phase_1(input);                  /* Run the phase               */
```

```shell
break 74
```

### 运行该程序到断点位置

执行`disassemble`命令

```asm
   0x0000000000400e32 <+146>:    call   0x40149e <read_line>
=> 0x0000000000400e37 <+151>:    mov    %rax,%rdi
   0x0000000000400e3a <+154>:    call   0x400ee0 <phase_1>
```

位置`400e3a` 执行`call`指令, 调用`phase_1`, 这个函数的参数是`input`, 也就是输入字符串的地址, 该函数调用前会将其值保存到`%rdi`寄存器, 对应位置`400e37`的指令

例如,输入的字符串是`hello`

```asm
(gdb) info registers
rax            0x603780            6305664
rsi            0x603780            6305664
(gdb) x/s  6305664
0x603780 <input_strings>:    "hello"
```

### 进入 `phase_1`函数内部

```asm
(gdb) stepi
0x0000000000400ee0 in phase_1 ()
(gdb) disassemble
Dump of assembler code for function phase_1:
=> 0x0000000000400ee0 <+0>:    sub    $0x8,%rsp
   0x0000000000400ee4 <+4>:    mov    $0x402400,%esi
   0x0000000000400ee9 <+9>:    call   0x401338 <strings_not_equal>
   0x0000000000400eee <+14>:    test   %eax,%eax
   0x0000000000400ef0 <+16>:    je     0x400ef7 <phase_1+23>
   0x0000000000400ef2 <+18>:    call   0x40143a <explode_bomb>
   0x0000000000400ef7 <+23>:    add    $0x8,%rsp
   0x0000000000400efb <+27>:    ret
End of assembler dump.
```

位置`400ee4`处的指令会将`0x402400`放入`%esi`中, 然后调用`strings_not_equal`函数
函数执行完毕后, 会根据`test %eax,%eax`的结果进行跳转, 如果该寄存器的值为`0`则表示字符串相等`phase_1`调用结束,
反之为`1`,表示字符串不等,跳转到`400ef2`调用`explode_bomb`,在屏幕上输出输出炸弹爆炸的信息

根据`phase_1`, 目标字符串保存在`0x402400`位置处, 输入的字符串的地址保存在`%rsi`中
使用`x/s address`即可输出该位置的字符串

```asm
(gdb) x/s 0x402400
0x402400:    "Border relations with Canada have never been better."
```

### 拆弹

```shell
$ ./bomb
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Border relations with Canada have never been better.
Phase 1 defused. How about the next one?

```

## 第二个炸弹

### 在第 82 行设置断点

在代码中找到调用 `phase_2` 函数的行，并设置断点：

```c
82 phase_2(input);
```

进入该函数后，反汇编：

```assembly
0x0000000000400efc <+0>:    push   %rbp
0x0000000000400efd <+1>:    push   %rbx
0x0000000000400efe <+2>:    sub    $0x28,%rsp
0x0000000000400f02 <+6>:    mov    %rsp,%rsi
0x0000000000400f05 <+9>:    call   0x40145c <read_six_numbers>
```

在 `0x400f05` 位置调用了 `read_six_numbers` 函数。此时 `%rdi` 的值是 `input` 的地址，而 `%rsi` 的值是栈顶指针 `%rsp` 的值，即：

```assembly
(gdb) info registers
rsi            0x7fffffffe400      140737488348160
rdi            0x6037d0            6305744
```

### 分析 `read_six_numbers` 函数

函数 `read_six_numbers` 的反汇编代码如下：

```assembly
(gdb) disassemble
Dump of assembler code for function read_six_numbers:
   0x000000000040145c <+0>:    sub    $0x18,%rsp
   0x0000000000401460 <+4>:    mov    %rsi,%rdx
   0x0000000000401463 <+7>:    lea    0x4(%rsi),%rcx
   0x0000000000401467 <+11>:    lea    0x14(%rsi),%rax
   0x000000000040146b <+15>:    mov    %rax,0x8(%rsp)
   0x0000000000401470 <+20>:    lea    0x10(%rsi),%rax
   0x0000000000401474 <+24>:    mov    %rax,(%rsp)
   0x0000000000401478 <+28>:    lea    0xc(%rsi),%r9
   0x000000000040147c <+32>:    lea    0x8(%rsi),%r8
   0x0000000000401480 <+36>:    mov    $0x4025c3,%esi
   0x0000000000401485 <+41>:    mov    $0x0,%eax
   0x000000000040148a <+46>:    call   0x400bf0 <__isoc99_sscanf@plt>
```

该函数调用 `sscanf` 将输入解析为 6 个整数。其原型为：

```c
int sscanf(const char *str, const char *format, ...);
```

参数的映射如下：

- `%rdi`：输入字符串的地址 (`input`)。
- `%rsi`：格式字符串地址 (`"%d %d %d %d %d %d"`，位于 `0x4025c3`)。
- `%rdx, %rcx, %r8, %r9`：前四个整数的地址。
- 栈中保存剩余两个整数的地址 (`%rsp+8` 和 `%rsp`)。

输入数据最终被保存到以下地址：

```assembly
rdx         0xe400
rcx         0xe404
r8          0xe408
r9          0xe40c
(%rsp)      0xe410
(%rsp + 8)  0xe414
```

验证解析的整数数量是否为 6：

```assembly
   0x000000000040148f <+51>:    cmp    $0x5,%eax
   0x0000000000401492 <+54>:    jg     0x401499 <read_six_numbers+61>
   0x0000000000401494 <+56>:    call   0x40143a <explode_bomb>
   0x0000000000401499 <+61>:    add    $0x18,%rsp
   0x000000000040149d <+65>:    ret
```

若解析的整数少于 6 个，会调用 `explode_bomb` 函数触发炸弹。注意：使用的是 `jg` 指令，因此解析的整数超过 6 个不会引发爆炸。

### 验证数据是否符合要求

接着，`phase_2` 函数开始验证解析的数据是否符合要求。

#### 验证第一个数是否为 1

```assembly
   0x0000000000400f0a <+14>:    cmpl   $0x1,(%rsp)
   0x0000000000400f0e <+18>:    je     0x400f30 <phase_2+52>
   0x0000000000400f10 <+20>:    call   0x40143a <explode_bomb>
```

若第一个数不等于 1，则触发炸弹。此时：

```assembly
(gdb) x/4x 0x7fffffffe400
0x7fffffffe400:    0x01    0x00    0x00    0x00
```

第一个数为 1，符合要求。

#### 验证后续数据

如果第一个数正确，跳转到 `0x400f30` 进入循环：

```assembly
   0x0000000000400f30 <+52>:    lea    0x4(%rsp),%rbx
   0x0000000000400f35 <+57>:    lea    0x18(%rsp),%rbp
   0x0000000000400f3a <+62>:    jmp    0x400f17 <phase_2+27>
```

其中：

- `%rbp = %rsp + 0x18`：指向最后一个数的地址。
- `%rbx = %rsp + 0x4`：指向第二个数的地址。

循环体代码如下：

```assembly
   0x0000000000400f17 <+27>:    mov    -0x4(%rbx),%eax
   0x0000000000400f1a <+30>:    add    %eax,%eax
   0x0000000000400f1c <+32>:    cmp    %eax,(%rbx)
   0x0000000000400f1e <+34>:    je     0x400f25 <phase_2+41>
   0x0000000000400f20 <+36>:    call   0x40143a <explode_bomb>
   0x0000000000400f25 <+41>:    add    $0x4,%rbx
   0x0000000000400f29 <+45>:    cmp    %rbp,%rbx
   0x0000000000400f2c <+48>:    jne    0x400f17 <phase_2+27>
```

- 将上一个数（`%rbx-4`）的值乘 2。
- 将结果与当前数（`%rbx`）比较，若不相等则触发炸弹。
- 将 `%rbx` 加 4，指向下一个数。
- 若未到达 `%rbp`（最后一个数），继续循环。

这一逻辑类似于以下 C 代码：

```c
for (int i = 1; i < 6; i++) {
    if (numbers[i] != 2 * numbers[i - 1]) {
        explode_bomb();
    }
}
```

### 正确输入

经过分析，要求输入的 6 个整数是一个以 1 开始、每个数是前一个数的 2 倍的序列。正确输入为：

```plaintext
1 2 4 8 16 32
```

完整拆弹过程示例：

```plaintext
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Border relations with Canada have never been better.
Phase 1 defused. How about the next one?
1 2 4 8 16 32 a b c
That's number 2.  Keep going!
```

## 第三个炸弹

### 设置断点, 反汇编函数

在 89 行处设置断点,进入`phase_3`函数, 反汇编该函数

- 第一部分:

```assembly
(gdb) disassemble
Dump of assembler code for function phase_3:
=> 0x0000000000400f43 <+0>:    sub    $0x18,%rsp
   0x0000000000400f47 <+4>:    lea    0xc(%rsp),%rcx
   0x0000000000400f4c <+9>:    lea    0x8(%rsp),%rdx
   0x0000000000400f51 <+14>:    mov    $0x4025cf,%esi
   0x0000000000400f56 <+19>:    mov    $0x0,%eax
   0x0000000000400f5b <+24>:    call   0x400bf0 <__isoc99_sscanf@plt>
   0x0000000000400f60 <+29>:    cmp    $0x1,%eax
   0x0000000000400f63 <+32>:    jg     0x400f6a <phase_3+39>
   0x0000000000400f65 <+34>:    call   0x40143a <explode_bomb>
```

会从输入中读入两个`int`类型的数据, 放入 `%rsp + 0x8`和`%rsp + 0xc`这两个位置

```assembly
(gdb) print $rsp
$1 = (void *) 0x7fffffffe458
```

也就是

```python
>>> hex(0x7fffffffe458 + 0x8)
'0x7fffffffe460'
>>> hex(0x7fffffffe458 + 0xc)
'0x7fffffffe464'
```

- 第二部分

设第一个数为`x`

```asm
   0x0000000000400f6a <+39>:    cmpl   $0x7,0x8(%rsp)
   0x0000000000400f6f <+44>:    ja     0x400fad <phase_3+106>
```

根据上述汇编, `x <= 7`

```assembly
   0x0000000000400f71 <+46>:    mov    0x8(%rsp),%eax
   0x0000000000400f75 <+50>:    jmp    *0x402470(,%rax,8)
```

取出位置`0x402470 + 8x`的值,将其作为下一条指令的地址

```python
>>> hex(0x402470 + 0)
'0x402470'
>>> hex(0x402470 + 8)
'0x402478'
>>> hex(0x402470 + 16)
'0x402480'
```

查看这些地址存放的值

```assembly
(gdb) x/16x 0x402470
0x402470:    0x00400f7c    0x00000000    0x00400fb9    0x00000000
0x402480:    0x00400f83    0x00000000    0x00400f8a    0x00000000
0x402490:    0x00400f91    0x00000000    0x00400f98    0x00000000
0x4024a0:    0x00400f9f    0x00000000    0x00400fa6    0x00000000
```

例如, 当`x == 0`时, 取出位置`0x402470`的值,也就是 `0x00400f7c`, 跳转到该地址, 执行以下指令

```assembly
   0x0000000000400f7c <+57>:    mov    $0xcf,%eax
   0x0000000000400f81 <+62>:    jmp    0x400fbe <phase_3+123>
   ...
   0x0000000000400fbe <+123>:    cmp    0xc(%rsp),%eax
   0x0000000000400fc2 <+127>:    je     0x400fc9 <phase_3+134>
   0x0000000000400fc4 <+129>:    call   0x40143a <explode_bomb>
```

这种情况下就会比较第二个数和`0xcf`是否相等

同理, 当`x == 1`时, 会测试第二个数是否等于`0x137`

拆弹:

```txt
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Border relations with Canada have never been better.
Phase 1 defused. How about the next one?
1 2 4 8 16 32
That's number 2.  Keep going!
0 207
Halfway there!
```

## 第四个炸弹

### 反汇编 `phase_4`函数

```assembly
...
0x0000000000401024 <+24>:    call   0x400bf0 <__isoc99_sscanf@plt>
0x0000000000401029 <+29>:    cmp    $0x2,%eax
0x000000000040102c <+32>:    jne    0x401035 <phase_4+41>
...
0x000000000040102e <+34>:    cmpl   $0xe,0x8(%rsp)
0x0000000000401033 <+39>:    jbe    0x40103a <phase_4+46>
0x0000000000401035 <+41>:    call   0x40143a <explode_bomb>
...
0x0000000000401048 <+60>:    call   0x400fce <func4>
0x000000000040104d <+65>:    test   %eax,%eax
0x000000000040104f <+67>:    jne    0x401058 <phase_4+76>
...
0x0000000000401051 <+69>:    cmpl   $0x0,0xc(%rsp)
0x0000000000401056 <+74>:    je     0x40105d <phase_4+81>
0x0000000000401058 <+76>:    call   0x40143a <explode_bomb>
```

从这段汇编代码, 可以得出以下信息:

- 能够从输入中得到`两个整数`
- 第一个数 x, `x <= 14`
- `func4` 函数的返回值 `%rax == 0`
- 第二个数 y, `y == 0`

### 反汇编 `func4`函数

从整体来看, `func4`函数调用了自己, 所以这是一个递归程序

```assembly
   0x0000000000400fe2 <+20>:    cmp    %edi,%ecx
   0x0000000000400fe4 <+22>:    jle    0x400ff2 <func4+36>
   ...
   0x0000000000400fe9 <+27>:    call   0x400fce <func4>
   ...
   0x0000000000400ffe <+48>:    call   0x400fce <func4>

```

第一部分:

```assembly
0x0000000000400fce <+0>:    sub    $0x8,%rsp
0x0000000000400fd2 <+4>:    mov    %edx,%eax
0x0000000000400fd4 <+6>:    sub    %esi,%eax
0x0000000000400fd6 <+8>:    mov    %eax,%ecx
0x0000000000400fd8 <+10>:    shr    $0x1f,%ecx
0x0000000000400fdb <+13>:    add    %ecx,%eax
0x0000000000400fdd <+15>:    sar    $1,%eax
0x0000000000400fdf <+17>:    lea    (%rax,%rsi,1),%ecx
```

函数的参数分别保存在`%rdi, %rsi, %rdx, %rcx` 中,在这里使用`a, b, c, d`表示
调用函数时, 假设参数分别为`1, 0, 14, 0`,执行上诉汇编代码:

```python
m = c = 14
m = m - b = 14 - 0 = 14
d = m = 14
d = d >> 31 = 14 >> 31 = 0
m = m + d = 14 + 0 = 14
m = 14 >> 1 = 7
d = 7 + b = 7 + 0 = 7
```

可以看出, 这段代码的功能是求区间`[b, c]`的中间值,保存在`d`中

第二部分:

知道了区间的中点后,将其和`x`进行比较, 会根据结果进入不同分支

```assembly
0x0000000000400fe2 <+20>:    cmp    %edi,%ecx
0x0000000000400fe4 <+22>:    jle    0x400ff2 <func4+36>
```

**假设不满足`d <= a`这个条件** , 即中间值比`x`大, 跳转, 会执行下述汇编代码

```asm
0x0000000000400fe6 <+24>:    lea    -0x1(%rcx),%edx
0x0000000000400fe9 <+27>:    call   0x400fce <func4>
```

此时发起的调用为`func(1, 0, 6, 7)`, 从区间`[0, 6]`查找

**假设满足这个条件, 跳转**, 执行下述汇编代码

```assembly
0x0000000000400ff2 <+36>:    mov    $0x0,%eax
0x0000000000400ff7 <+41>:    cmp    %edi,%ecx
0x0000000000400ff9 <+43>:    jge    0x401007 <func4+57>
0x0000000000400ffb <+45>:    lea    0x1(%rcx),%esi
0x0000000000400ffe <+48>:    call   0x400fce <func4>
0x0000000000401003 <+53>:    lea    0x1(%rax,%rax,1),%eax
```

这里也有两个分支

```assembly
0x0000000000400ff7 <+41>:    cmp    %edi,%ecx
0x0000000000400ff9 <+43>:    jge    0x401007 <func4+57>
```

- 满足这个条件`d >= a`, 结合上一个条件`d <= a`,即`d == a`时,函数执行返回

- 如果不满足这个条件`d >= a`, 此时发起的调用为`func(1, 8, 14, 7)`
  注意到, 这个分支会将使得`%rax = 2 * %rax + 1`, 结合函数执行返回时,要让`%rax = 0`, 也就是说,只要执行该分支的代码就必然不满足`%rax == 0`的条件

### `func4`的`python`版本

根据上面, 函数的整体逻辑为:

```python
if d <= a:
   if d >= a:
      return 0
   return 2 * fun(1, 8, 14, 7) + 1
else:
   return 2 * func(1, 0, 6, 7)
```

这是一个**二分搜索, 搜索区间为[b, c]**, 满足`%rax == 0`条件的**x 不位于二分搜索树的右子树**

以下是`python`版本

```python
def func(x, y, m, n):
    a = m - y
    n = a >> 31
    a = a + n
    a = a >> 1
    n = a + y     # n middle of the [y, m]

    if n <= x:
        if n >= x:
            return 0
        a = func(x, n + 1, m, n)
        return 2 * a + 1
    else:
        a = func(x, y, n - 1, n)
        return a * 2

# 测试结果
for i in range(0, 15):
    if func(i, 0, 14, 0) == 0:
        print(i)
# 0 1 3 7
# [0, 14]
# [0, 7], [8, 14]
# [0, 3], [4, 7];
# [0, 1]
# [0, 0]
```

拆弹:

```txt
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Border relations with Canada have never been better.
Phase 1 defused. How about the next one?
1 2 4 8 16 32
That's number 2.  Keep going!
1 311
Halfway there!
3 0
So you got that one.  Try this one.
```

## 第五个炸弹

### 先看汇编代码位置`0x4010b3`后的内容

1. 根据函数`strings_not_equal`知道,比较的应该是两个字符串
2. 将 `rsp+16 (rsp+0x10)`处的值和`0x40245e`位置的值进行比较, 相等则结束,否则炸弹爆炸

```asm
0x00000000004010b3 <+81>:    mov    $0x40245e,%esi
0x00000000004010b8 <+86>:    lea    0x10(%rsp),%rdi
0x00000000004010bd <+91>:    call   0x401338 <strings_not_equal>
0x00000000004010c2 <+96>:    test   %eax,%eax
0x00000000004010c4 <+98>:    je     0x4010d9 <phase_5+119>
0x00000000004010c6 <+100>:    call   0x40143a <explode_bomb>
0x00000000004010cb <+105>:    nopl   0x0(%rax,%rax,1)
0x00000000004010d0 <+110>:    jmp    0x4010d9 <phase_5+119>
```

看一下`0x40245e`保存的字符串,也就是要得到的字符串是`flyers`

```asm
(gdb) x/s 0x40245e
0x40245e:    "flyers"
```

### 回到代码的开头,可知输入的长度为 `6`

```asm
   0x000000000040107a <+24>:    call   0x40131b <string_length>
   0x000000000040107f <+29>:    cmp    $0x6,%eax
   0x0000000000401082 <+32>:    je     0x4010d2 <phase_5+112>
   0x0000000000401084 <+34>:    call   0x40143a <explode_bomb>
```

### 代码的主体部分

```asm
   0x000000000040108b <+41>:    movzbl (%rbx,%rax,1),%ecx
   0x000000000040108f <+45>:    mov    %cl,(%rsp)
   0x0000000000401092 <+48>:    mov    (%rsp),%rdx
   0x0000000000401096 <+52>:    and    $0xf,%edx
```

```asm
   0x0000000000401067 <+5>:    mov    %rdi,%rbx
```

1. 根据代码开头的汇编,知道`rbx`保存了输入的位置,结合这部分代码,会取出输入的最低 `4` 位放入`edx`中

2. 然后下面接下来的指令:

```asm
   0x0000000000401099 <+55>:    movzbl 0x4024b0(%rdx),%edx
   0x00000000004010a0 <+62>:    mov    %dl,0x10(%rsp,%rax,1)
   0x00000000004010a4 <+66>:    add    $0x1,%rax
   0x00000000004010a8 <+70>:    cmp    $0x6,%rax
   0x00000000004010ac <+74>:    jne    0x40108b <phase_5+41>
```

`0x401099`处指令表示取出`0x4024b0+rdx`的 1 字节并零扩展到 4 字节放入`edx`中
然后将`dl`中的数据放入`0x10(%rsp,%rax,1)`位置处
最后将`rax`的值加 1, 重复上诉过程

查看`0x4024b0`位置处的值

```asm
(gdb) x/s 0x4024b0
0x4024b0 <array.3449>:    "maduiersnfotvbylSo you think you can stop the bomb with ctrl-c, do you?"
```

所以可以知道,代码的整体流程会从`0x4024b0`挑选出`6`个字符,放在以`rsp+16`开始的位置,不妨取偏移为`9 15 14 5 6 7`,即`9 f e 5 6 7`
比较 `ASCII`码表,选择低字节满足要求的字符,不妨取`9on567`
注意,答案不止一种

## 第六个炸弹

### 保存输入

位置`0x401106`处的指令`call   0x40145c <read_six_numbers>`
根据前面的阶段可以知道会读入`6`个数,分别放入位置 `rsp, rsp+4, rsp+8, rsp+12, rsp+16, rsp+20`

### 检查输入

从`0x401117`到`0x401151`处的指令会对输入做一些检查

1. 每个数都小于等于 6,并且大于 0
2. 每个数各不相同

#### 检查一

寄存器`r13`初始值为`rsp`的值,也就是第一个输入的值
位置`0x401114`到`0x401123`处的指令会比较该值减去 1 和 5 的关系,如果大与 5,炸弹爆炸,否则正常进行

```asm
0x0000000000401114 <+32>:    mov    %r13,%rbp
0x0000000000401117 <+35>:    mov    0x0(%r13),%eax
0x000000000040111b <+39>:    sub    $0x1,%eax
0x000000000040111e <+42>:    cmp    $0x5,%eax
0x0000000000401121 <+45>:    jbe    0x401128 <phase_6+52>
0x0000000000401123 <+47>:    call   0x40143a <explode_bomb>
```

位置`0x40114d`处的指令, 将`r13`的值加 4,也就是下一个输入的位置,然后重新跳转到`0x401114`

```asm
0x000000000040114d <+89>:    add    $0x4,%r13
0x0000000000401151 <+93>:    jmp    0x401114 <phase_6+32>
```

在每次检查,寄存器`r12d`会增加 1
位置`0x40112c`处的指令:

```asm
0x000000000040112c <+56>:    cmp    $0x6,%r12d
0x0000000000401130 <+60>:    je     0x401153 <phase_6+95>
```

知当寄存器`r12d`等于 6 时,结束循环,且`r12d`表示这是第几个输入

#### 检查二

检查一是外层循环, 内层循环会检查各个数之间的相等关系
位置`0x401132`到位置`0x40114b`是内层循环的主体部分, 寄存器`ebx`是迭代变量,通过`0x401138`处的指令`mov (%rsp,%rax,4),%eax`, 将值放入`eax`中
然后比较`eax`和`rbp`中的值
如果不等,正常进行,否则炸弹爆炸

```asm
 0x0000000000401132 <+62>:    mov    %r12d,%ebx
0x0000000000401135 <+65>:    movslq %ebx,%rax
0x0000000000401138 <+68>:    mov    (%rsp,%rax,4),%eax
0x000000000040113b <+71>:    cmp    %eax,0x0(%rbp)
0x000000000040113e <+74>:    jne    0x401145 <phase_6+81>
0x0000000000401140 <+76>:    call   0x40143a <explode_bomb>
0x0000000000401145 <+81>:    add    $0x1,%ebx
0x0000000000401148 <+84>:    cmp    $0x5,%ebx
0x000000000040114b <+87>:    jle    0x401135 <phase_6+65>
```

从检查二和检查一可以知道,这六个输入为 1 到 6 的数,且各不相等

### 处理输入

```asm
0x0000000000401153 <+95>:    lea    0x18(%rsp),%rsi
0x0000000000401158 <+100>:    mov    %r14,%rax
0x000000000040115b <+103>:    mov    $0x7,%ecx
0x0000000000401160 <+108>:    mov    %ecx,%edx
0x0000000000401162 <+110>:    sub    (%rax),%edx
0x0000000000401164 <+112>:    mov    %edx,(%rax)
0x0000000000401166 <+114>:    add    $0x4,%rax
0x000000000040116a <+118>:    cmp    %rsi,%rax
0x000000000040116d <+121>:    jne    0x401160 <phase_6+108>
```

这部分代码的功能为 x = 7 - x,并将结果放回原处,x 为输入的数据

### 获取节点的位置

指令跳转到`0x401197`处, 将值保存到寄存器`ecx`中,而且结合下面的指令:

```asm
0x000000000040118d <+153>:    add    $0x4,%rsi
0x0000000000401191 <+157>:    cmp    $0x18,%rsi
0x0000000000401195 <+161>:    je     0x4011ab <phase_6+183>
```

可以知道:

1. 这是个循环, 只有当`rsi`等于`0x18`时才会推出循环
2. `ecx`保存的是输入值

该循环也有一个内层循环,位置从`0x401176`到`0x40117f`:
会根据`ecx`的值进行循环,每次循环将`rdx`的值加 8,当`eax = ecx`时,将`rdx`的值保存到`0x20(%rsp,%rsi,2)`位置处

根据上面的代码, 可以知道会将节点位置分别保存在`rsp+20, rsp+28, rsp+30, rsp+38, rsp+40, rsp+48`(16 进制),
这些节点和`7-x`存在一一对应的关系,如当`7-x==1`时,该位置则对应第一个节点,

最后在 `0x401195`处结束循环, 跳转到 位置`4011ab`

### 链接节点

```asm
0x00000000004011ab <+183>:    mov    0x20(%rsp),%rbx
0x00000000004011b0 <+188>:    lea    0x28(%rsp),%rax
0x00000000004011b5 <+193>:    lea    0x50(%rsp),%rsi

0x00000000004011ba <+198>:    mov    %rbx,%rcx
0x00000000004011bd <+201>:    mov    (%rax),%rdx
0x00000000004011c0 <+204>:    mov    %rdx,0x8(%rcx)
0x00000000004011c4 <+208>:    add    $0x8,%rax
0x00000000004011c8 <+212>:    cmp    %rsi,%rax
0x00000000004011cb <+215>:    je     0x4011d2 <phase_6+222>
0x00000000004011cd <+217>:    mov    %rdx,%rcx
0x00000000004011d0 <+220>:    jmp    0x4011bd <phase_6+201>
0x00000000004011d2 <+222>:    movq   $0x0,0x8(%rdx)
```

`0x4011c0`处的指令会将节点链接起来,形成一个链表,链表的顺序为`7 - x`的顺序,

### 比较节点大小

`0x4011e3`取出 4 字节的内容放入`eax`中
比较`rbx`地址保存的值和`eax`比较,若后者大于前者则正常进行,否则炸弹爆炸,以此类推
节点 1 > 节点 2 > 节点 3 > 节点 4 > 节点 5 > 节点 6

```asm
0x00000000004011df <+235>:    mov    0x8(%rbx),%rax
0x00000000004011e3 <+239>:    mov    (%rax),%eax
0x00000000004011e5 <+241>:    cmp    %eax,(%rbx)
0x00000000004011e7 <+243>:    jge    0x4011ee <phase_6+250>
0x00000000004011e9 <+245>:    call   0x40143a <explode_bomb>
```

查看 `0x6032d0`开始的节点和其值
![alt text](/images/image.png)

<!-- |node|值 16 进制|10 进制|

|---|---|--|
|1|0x014c|332|f
|2|0x00a8|168|
|3|0x039c|924|
|4|0x02b3|691|
|5|0x01dd|477|
|6|0x01bb|443| -->

要满足递减的顺序,所以其排列为`3, 4, 5, 6, 1, 2`
所以输入的数为`7-x`, 即`4, 3, 2, 1, 6, 5`

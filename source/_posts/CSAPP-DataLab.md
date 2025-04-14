---
title: CSAPP DataLab
abbrlink: "61702333"
date: 2024-11-19 17:55:48
categories: CSAPP
toc: true
---

csapp DataLab

<!-- more -->

## bitXor

```c
/*
 * bitXor - x^y using only ~ and &
 *   Example: bitXor(4, 5) = 1
 *   Legal ops: ~ &
 *   Max ops: 14
 *   Rating: 1
 */
int bitXor(int x, int y) {
  return ~(~y & ~x) & ~(x & y);
}
```

## tmin

```c
/*
 * tmin - return minimum two's complement integer
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 4
 *   Rating: 1
 */
int tmin(void) {
  return 1 << 31;
}
```

## isTmax

```c
/*
 * isTmax - returns 1 if x is the maximum, two's complement number,
 *     and 0 otherwise
 *   Legal ops: ! ~ & ^ | +
 *   Max ops: 10
 *   Rating: 1
 */
int isTmax(int x) {
  return !(~x ^ (x + 1)) & !!(x + 1);
}
```

## allOddBits

```c
/*
 * allOddBits - return 1 if all odd-numbered bits in word set to 1
 *   where bits are numbered from 0 (least significant) to 31 (most significant)
 *   Examples allOddBits(0xFFFFFFFD) = 0, allOddBits(0xAAAAAAAA) = 1
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 12
 *   Rating: 2
 */
int allOddBits(int x) {
  int mask = 0xAA;
  mask = mask << 8 | mask;
  mask = mask << 16 | mask;
  return !((x & mask )^ mask);
}

```

## negate

```c
/*

- negate - return -x
- Example: negate(1) = -1.
- Legal ops: ! ~ & ^ | + << >>
- Max ops: 5
- Rating: 2
  _/
*/
  int negate(int x) {
    return ~x + 1;
  }

```

## isAsciiDigit

```c
/*
 * isAsciiDigit - return 1 if 0x30 <= x <= 0x39 (ASCII codes for characters '0' to '9')
 *   Example: isAsciiDigit(0x35) = 1.
 *            isAsciiDigit(0x3a) = 0.
 *            isAsciiDigit(0x05) = 0.
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 15
 *   Rating: 3
 */
int isAsciiDigit(int x) {
  int y = x >> 4;
  int z = x & 0xf; // 最低4位

  return !(y ^ 0x3) & !((0x9 + ((~z) + 1)) >> 31);
}
```

## conditional

```c
/*
 * conditional - same as x ? y : z
 *   Example: conditional(2,4,5) = 4
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 16
 *   Rating: 3
 */
int conditional(int x, int y, int z) {

  int isZero = !(x ^ 0);
  int mask = ~isZero + 1;
  return (~mask & y) | (mask & z);
}

```

## isLessOrEqual

```c
/*
 * isLessOrEqual - if x <= y  then return 1, else return 0
 *   Example: isLessOrEqual(4,5) = 1.
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 24
 *   Rating: 3
 */
int isLessOrEqual(int x, int y) {

  int signx = x >> 31;
  int signy = y >> 31;
  int c1 = !(signx ^ signy);
  int signsub = (x + (~y + 1)) >> 31;

  // return !(x ^ y) | (!c1 & signx) | (c1 & signsub) |  (c1 & signsub);
  return (!(x ^ y)) | ((!c1) & signx) | (c1 & signsub);


}
```

## logicalNeg

```c

/*
 * logicalNeg - implement the ! operator, using all of
 *              the legal operators except !
 *   Examples: logicalNeg(3) = 0, logicalNeg(0) = 1
 *   Legal ops: ~ & ^ | + << >>
 *   Max ops: 12
 *   Rating: 4
 */
int logicalNeg(int x) {
  return ((x | (~x + 1)) >> 31) + 1;
}
```

## howManyBits

```c

/* howManyBits - return the minimum number of bits required to represent x in
 *             two's complement
 *  Examples: howManyBits(12) = 5
 *            howManyBits(298) = 10
 *            howManyBits(-5) = 4
 *            howManyBits(0)  = 1
 *            howManyBits(-1) = 1
 *            howManyBits(0x80000000) = 32
 *  Legal ops: ! ~ & ^ | + << >>
 *  Max ops: 90
 *  Rating: 4
 */
int howManyBits(int x) {
  int b16, b8, b4, b2, b1, b0;
  int sign = x >> 31;
  x = (sign & ~x) | (~sign & x);
  b16 = !!(x >> 16) << 4;
  x = x >> b16;
  b8 = !!(x >> 8) << 3;
  x = x >> b8;
  b4 = !!(x >> 4) << 2;
  x = x >> b4;
  b2 = !!(x >> 2) << 1;
  x = x >> b2;
  b1 = !!(x >> 1);
  x = x >> b1;
  b0 = x;
  return b16 + b8 + b4 + b2 + b1 + b0 + 1;
}
```

## floatScale2

```c

/*
 * floatScale2 - Return bit-level equivalent of expression 2*f for
 *   floating point argument f.
 *   Both the argument and result are passed as unsigned int's, but
 *   they are to be interpreted as the bit-level representation of
 *   single-precision floating point values.
 *   When argument is NaN, return argument
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. also if, while
 *   Max ops: 30
 *   Rating: 4
 */
unsigned floatScale2(unsigned uf) {
  unsigned s = uf & (1 << 31);
  unsigned exp = (uf & 0x7f800000) >> 23;
  unsigned frac = (uf & ~0xff800000);

  if (exp == 0) return s | frac << 1;
  else if (exp == 255) return uf;
  return s | (exp + 1) << 23| frac;

}
```

## floatFloat2Int

```c

/*
 * floatFloat2Int - Return bit-level equivalent of expression (int) f
 *   for floating point argument f.
 *   Argument is passed as unsigned int, but
 *   it is to be interpreted as the bit-level representation of a
 *   single-precision floating point value.
 *   Anything out of range (including NaN and infinity) should return
 *   0x80000000u.
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. also if, while
 *   Max ops: 30
 *   Rating: 4
 */
int floatFloat2Int(unsigned uf) {

  unsigned s = uf & (1 << 31);
  unsigned exp = (uf & 0x7f800000) >> 23;
  unsigned frac = (uf & ~0xff800000);

  int sign = (s >> 31) == 1 ?-1 : 1;
  int E = exp - 127;
  unsigned M = frac | (1 << 23);

  if (E > 31 || exp == 255) {
    return 0x80000000u;
  }
  if (E < 0) return 0;

  return sign * (E > 23 ? M << (E - 23) : M >> (23 - E));
}
```

## floatPower2

```c
/*
 * floatPower2 - Return bit-level equivalent of the expression 2.0^x
 *   (2.0 raised to the power x) for any 32-bit integer x.
 *
 *   The unsigned value that is returned should have the identical bit
 *   representation as the single-precision floating-point number 2.0^x.
 *   If the result is too small to be represented as a denorm, return
 *   0. If too large, return +INF.
 *
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. Also if, while
 *   Max ops: 30
 *   Rating: 4
 */
unsigned floatPower2(int x) {
  if (x < -149) {
        return 0;
    } else if (x > 127) {
        return 0x7F800000;
    } else if (x >= -126) {
        int exp = x + 127;
        return exp << 23;
    } else {
        int frac = 1 << (23 - (-126 - x));
        return frac;
    }
}

```

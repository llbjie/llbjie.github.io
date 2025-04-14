---
title: CSAPP ShellLab
categories: CSAPP
abbrlink: 88ff41e9
date: 2025-03-14 17:56:54
tags:
toc: true
---
csapp ShellLab
<!-- more -->

## 实验准备

实验提供了一些结构体和函数

### 结构体 `job_t`

首先是`job_t`，和保存`job`的数组`jobs`

```c
struct job_t {
    pid_t pid;
    int jid;
    int state;
    char cmdline[MAXLINE];
};
struct job_t jobs[MAXJOBS];
```

有两个注意项

- 在实验中都需要小心维护`jobs`,原因是程序涉及到对这个数组并发操作
- `state`保存这任务的状态:`UNDEF,FG,BG,ST`,由宏定义

### 辅助函数

程序提供了下面一些辅助函数，可以用于任务相关的操作

```c
void clearjob(struct job_t *job);
void initjobs(struct job_t *jobs);
int maxjid(struct job_t *jobs);
int addjob(struct job_t *jobs, pid_t pid, int state, char *cmdline);
int deletejob(struct job_t *jobs, pid_t pid);
pid_t fgpid(struct job_t *jobs);
struct job_t *getjobpid(struct job_t *jobs, pid_t pid);
struct job_t *getjobjid(struct job_t *jobs, int jid);
int pid2jid(pid_t pid);
void listjobs(struct job_t *jobs);
```

例如，可以使用`addjob`添加一个任务到`jobs`数组中；可以使用`fgpid`通过`pid`获取任务的指针

### `main`的主要逻辑

```c
int main(int argc, char **argv) {
    //...
    Signal(SIGINT,  sigint_handler);
    Signal(SIGTSTP, sigtstp_handler);
    Signal(SIGCHLD, sigchld_handler);

    Signal(SIGQUIT, sigquit_handler);

     while (1) {
        eval(cmdline);
    }
    //...
}
```

- 已经绑定了`SIGINT, SIGTSTP, SIGCHLD, SIGQUIT`这四个信号，除了最后一个外都需要实现信号处理函数
- `while` 反复调用了`eval`函数，用于解析命令并交由对应的程序处理

## 实现

这个`lab`, 要求实现下面七个函数：

```c
void eval(char *cmdline);
int builtin_cmd(char **argv);
void do_bgfg(char **argv);
void waitfg(pid_t pid);

void sigchld_handler(int sig);
void sigint_handler(int sig);
void sigtstp_handler(int sig);
```

最后三个是信号处理函数

### `eval`

有二个要求

- 如果是内建命令，立即执行，否则创建一个子进程执行
- 如果子进程需要前台执行，程序会等待其完成，否则不等待

```c
 void eval(char *cmdline)
{
    char *argv[MAXARGS];
    char buf[MAXLINE];
    int bg;
    pid_t pid;

    sigset_t mask_all, mask_one, prev_all, prev_one;
    sigemptyset(&mask_one);
    sigaddset(&mask_one,SIGCHLD);
    sigfillset(&mask_all);

    strcpy(buf, cmdline);
    bg = parseline(buf, argv);

    int state = (bg == 1 ? BG: FG);
    if (argv[0] == NULL) {
        return;
    }

    if (!builtin_cmd(argv)) {
        sigprocmask(SIG_BLOCK, &mask_one, &prev_one);

        if ((pid = Fork()) == 0) {
            setpgid(0,0);
            sigprocmask(SIG_SETMASK, &prev_one, NULL);
            if (execve(argv[0], argv, environ) < 0 ) {
                printf("%s Command not found\n", argv[0]);
                exit(0);
            }
        }

        sigprocmask(SIG_BLOCK, &mask_all, &prev_all);
        addjob(jobs, pid, state, cmdline); // 可能添加失败
        sigprocmask(SIG_SETMASK, &prev_all, NULL);
        sigprocmask(SIG_SETMASK, &prev_one, NULL);

        struct job_t* job  = getjobpid(jobs, pid);

        if(!bg) {
            waitfg(pid);
        } else {
            printf("[%d] (%d) %s", job -> jid, pid, cmdline);
        }
    }

    return;
}
```

### `builtin_cmd`

```c
int builtin_cmd(char **argv)
{
    // quit, jobs, bg or fg
    if (!strcmp("quit", argv[0])) {
        exit(0);
    }

    if (!strcmp("bg", argv[0]) || !strcmp("fg", argv[0])) {
        do_bgfg(argv);
        return 1;
    }

    if (!strcmp("jobs", argv[0])) {
        listjobs(jobs);
        return 1;
    }
    return 0;     /* not a builtin command */
}
```

### `do_bgfg`

```c
void do_bgfg(char **argv)
{
    if (argv[1] == NULL) {
        printf("%s command requires PID or %%jobid argument\n", argv[0]);
        return;
    }

    int state = strcmp(argv[0], "bg") == 0? BG: FG;
    int id;
    struct job_t* job = NULL;

    if (argv[1][0] == '%') {
        if( sscanf(&argv[1][1], "%d", &id) > 0) {
            job = getjobjid(jobs, id);
            if (job == NULL) {
                printf("%%%d: No such job", id);
                return;
            }
        }
    }else if(sscanf(&argv[1][0], "%d", &id) > 0) {
        job = getjobjid(jobs, id);
        if (job == NULL) {
            printf("(%d): No such process\n", id);
            return;
        }
    }else {
        printf("%s: argument must be a PID or %%jobid\n",argv[0]);
        return;
    }

    sigset_t mask, prev;
    sigfillset(&mask);
    sigprocmask(SIG_BLOCK, &mask, &prev);
    job -> state = state;
    kill(-(job -> pid), SIGCONT);
    sigprocmask(SIG_SETMASK, &prev, NULL);

    if (state == BG) {
        printf("[%d] (%d) %s", job -> jid, job -> pid, job -> cmdline);
    }else{
        waitfg(job -> pid);
    }
    return;
}
```

### `waitfg`

```c
void waitfg(pid_t pid)
{
    sigset_t mask;
    sigemptyset(&mask);

    while(fgpid(jobs) != 0) {
        sigsuspend(&mask);
    }
    return;
}
```

### `sigchld_handler`

```c
void sigchld_handler(int sig)
{
    pid_t pid;
    int status;
    int olderrno = errno;
    struct job_t * job = NULL;

    sigset_t mask, prev;
    sigfillset(&mask);


    while ((pid = waitpid(-1, &status, WNOHANG | WUNTRACED)) > 0) {
        sigprocmask(SIG_BLOCK, &mask, &prev);
        if (WIFEXITED(status)) { // 正常终止
            deletejob(jobs, pid);
        }else if (WIFSIGNALED(status)) { // 被信号终止
            printf("Job [%d] (%d) terminated by signal %d\n", pid2jid(pid), pid, WTERMSIG(status));
            deletejob(jobs, pid);
        }else if (WIFSTOPPED(status)) { // 被信号停止
            printf("Job [%d] (%d) stopped by signal %d\n", pid2jid(pid), pid, WSTOPSIG(status));
            job = getjobpid(jobs, pid);
            job -> state = ST;
        }
        sigprocmask(SIG_SETMASK, &prev, NULL);
    }

    errno = olderrno;
    return;
}
```

### `sigint_handler`

```c
void sigint_handler(int sig)
{
    pid_t pid;
    if((pid = fgpid(jobs)) > 0) {
        kill(-pid, sig);
    }
    return;
}
```

### `sigtstp_handler`

```c
void sigtstp_handler(int sig)
{
    pid_t pid;
    if((pid = fgpid(jobs)) > 0) {
        kill(-pid, sig);
    }
    return;
}
```

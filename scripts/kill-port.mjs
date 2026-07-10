#!/usr/bin/env node
import { execSync } from 'node:child_process'

const port = process.argv[2] ?? '5174'

function killOnWindows() {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
    const pids = new Set()
    for (const line of out.split(/\r?\n/)) {
      const match = line.trim().match(/LISTENING\s+(\d+)\s*$/)
      if (match) pids.add(match[1])
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
        console.log(`已结束占用端口 ${port} 的进程 (PID ${pid})`)
      } catch {
        // 进程可能已退出
      }
    }
  } catch {
    // 端口未被占用
  }
}

function killOnUnix() {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' })
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGTERM')
        console.log(`已结束占用端口 ${port} 的进程 (PID ${pid})`)
      } catch {
        // ignore
      }
    }
  } catch {
    // 端口未被占用
  }
}

if (process.platform === 'win32') killOnWindows()
else killOnUnix()

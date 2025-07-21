import os from 'os';

export function getMemoryUsageMessage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usedMB = (used / 1024 / 1024).toFixed(2);
    const totalMB = (total / 1024 / 1024).toFixed(2);
    const freeMB = (free / 1024 / 1024).toFixed(2);

    return `Memory Usage: Used ${usedMB} MB / Total ${totalMB} MB (Free: ${freeMB} MB)`;
}

export function getCpuUsageMessage() {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce(
        (acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0),
        0
    );

    const totalUsage = totalTick - totalIdle;
    const usagePercentage = ((totalUsage / totalTick) * 100).toFixed(2);

    return `CPU Usage: ${usagePercentage}%`;
}

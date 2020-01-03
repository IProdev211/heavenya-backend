import express, {Router} from 'express';
import os from 'os-utils';
import nativeOs from 'os';

export let osRouter: Router = express.Router();

export interface Icpu {
  usage: number;
  numberOfCore: number;
  free: number;
}

export function getCPU(callback: any) {
  let cpu: Icpu = {
    free: 0,
    numberOfCore: os.cpuCount(),
    usage: 0,
  };

  os.cpuUsage(p => {
    cpu.usage = p * 100;
    os.cpuFree(f => {
      cpu.free = f * 100;
      callback(cpu);
    });
  });
}

export function getRAM() {
  return os.freememPercentage();
}

let path = os.platform() === 'win32' ? 'c:' : '/';
import disk from 'diskusage';

export interface Idisk {
  available:number;
  free:number;
  total:number;
}

export function getDISK(callback:any) {
  disk.check(path, function(err, info) {
    if (err) {
      console.log(err);
    } else {
      if (info !== undefined) {
        let diskUsage:Idisk = {
          available: info.available,
          free: info.free,
          total: info.total
        }
        callback(diskUsage)
      }
    }
  });
}

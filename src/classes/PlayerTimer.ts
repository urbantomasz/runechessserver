import { Room, Client, Delayed, Clock } from "colyseus";

export class PlayerTimer {
  private timer: Delayed;

  constructor(private clock: Clock, private initialTime: number) {
    this.start();
  }

  pause() {
    if (this.timer) {
      this.timer.pause();
    }
  }

  resume() {
    if (this.timer) {
      this.timer.resume();
    }
  }

  start() {
    if (!this.timer) {
      this.timer = this.clock.setTimeout(() => {
        this.initialTime -= 1000;
        if (this.initialTime > 0) {
          this.timer.clear();
          this.start();
        }
      }, 1000);
    } else {
      this.timer.resume();
    }
  }

  getRemainingTime() {
    return this.initialTime;
  }

  clear() {
    if (this.timer) {
      this.timer.clear();
      this.timer = null;
    }
  }

  isTimeOver() {
    return this.initialTime <= 0;
  }
}

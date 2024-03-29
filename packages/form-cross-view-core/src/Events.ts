export default class Events {
  events: { [k: string]: Function[] } = {};

  on(name: string, cb: Function) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(cb);
  }

  async emit(name: string, ...args: any[]) {
    try {
      const cbs = this.events[name] || [];
      for (let i = 0, len = cbs.length; i < len; i++) {
        // eslint-disable-next-line no-await-in-loop
        await cbs[i](...args);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
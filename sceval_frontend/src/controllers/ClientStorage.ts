import { ClientStorageData } from '../components/entities/User';
export default class ClientStorage {
  static setItem(key: string, value: any, ttl: number) {
    var data: ClientStorageData = {
      value: value
    };

    if (typeof ttl === 'number' && ttl > 0) {
      data.expire = Date.now() + ttl * 1000;
    }

    window.localStorage.setItem(key, JSON.stringify(data));
  }

  static getItem(key: string) {
    const serialized = window.localStorage.getItem(key);
    let data: ClientStorageData;

    if (serialized === null) {
      return null;
    }

    try {
      data = JSON.parse(serialized);
    } catch (err) {
      console.warn('Corrupt localStorage item [%s].', key);
      return null;
    }

    if (data.value === undefined) {
      console.warn('Corrupt localStorage item [%s].', key);
      return null;
    }

    if (typeof data.expire === 'number') {
      if (data.expire < Date.now()) {
        return null;
      }
    }

    return data.value;
  }

  static deleteItem(key: string) {
    window.localStorage.removeItem(key);
  }
}
